import { FileSystem, Terminal, Validator, type ValidationErrorDetail } from '@wppsync/shared';
import ansicolor from 'ansicolor';
import { type Job, Queue, Worker } from 'bullmq';
import { fileURLToPath } from 'node:url';

import type { Core } from '@/core/Core.js';

import { BaseModule } from '@/modules/Base.js';
import type { AnyBullJobSchema, BullJobData } from '@/modules/bull/JobSchema.js';
import {
	getBullListeners,
	isBullJobClass,
	type BullJobHandler,
	type BullListenerOptions
} from '@/modules/bull/Listener.js';

interface QueueJob {
	queue: Queue;
	definition: AnyBullJobSchema;
	handle: BullJobHandler;
	options?: BullListenerOptions;
	worker?: Worker;
}

export class BullJobValidationError extends Error {
	constructor(
		readonly jobName: string,
		readonly errors: ValidationErrorDetail[]
	) {
		super(`Validation failed for BullMQ job ${jobName}: ${JSON.stringify(errors)}`);
		this.name = 'BullJobValidationError';
	}
}

export class QueueModuleBase extends BaseModule {
	jobsInstances: QueueJob[] = [];

	async add<SJob extends AnyBullJobSchema>(definition: SJob, data: BullJobData<SJob>) {
		const job = this.jobsInstances.find(item => item.definition.name === definition.name);
		if (!job) {
			Terminal.error('BULLMQ', `Queue ${definition.name} not found`);
			return;
		}

		const { repeat: _repeat, ...options } = job.options ?? {};

		return job.queue.add(definition.name, data, { ...options, delay: undefined });
	}

	private async preHandler(job: QueueJob, jobInfo: Job): Promise<unknown> {
		const validation = await Validator.validate(job.definition.validator, jobInfo.data);

		if (!validation.success) {
			throw new BullJobValidationError(job.definition.name, validation.errors);
		}

		jobInfo.data = validation.data;

		return validation.data;
	}

	initHandlers() {
		if (this.jobsInstances.length === 0) return;

		for (const job of this.jobsInstances) {
			job.worker = new Worker(
				job.definition.name,
				async jobInfo => {
					const data = await this.preHandler(job, jobInfo);
					await job.handle(data, jobInfo);
					if (job.options?.delay) await new Promise(r => setTimeout(r, job.options?.delay));
				},
				{
					connection: {
						host: process.env.REDIS_HOST,
						port: Number(process.env.REDIS_PORT),
						username: process.env.REDIS_USERNAME,
						password: process.env.REDIS_PASSWORD,
						db: Number(process.env.REDIS_BULL_DB)
					}
				}
			);

			job.worker.on('failed', (jobInfo, err) => {
				console.error(err);
				Terminal.error('BULLMQ', `Queue ${job.definition.name} failed in job ${jobInfo?.id}`);
			});
		}
	}

	async init(core: Core) {
		const files = await FileSystem.loadFolder<Record<string, unknown>>(
			fileURLToPath(new URL('../../handlers/jobs', import.meta.url)),
			{
				recursive: true,
				filter_files: [/\.job\.(?:[cm]?[jt]s)$/],
				auto_import: true,
				auto_default: false
			}
		);

		for (const file of files) {
			if (!file.content) continue;

			for (const exportedItem of Object.values(file.content)) {
				if (typeof exportedItem !== 'function' || !exportedItem.prototype) continue;

				const listeners = getBullListeners(exportedItem.prototype);
				if (listeners.length === 0) continue;
				if (!isBullJobClass(exportedItem)) {
					throw new TypeError(
						`The class ${exportedItem.name} is not a valid BullMQ job. Did you forget the @BullJob() decorator?`
					);
				}

				const instance = core.providers.instantiate(exportedItem as new (...args: any[]) => object);
				const instanceMethods = instance as Record<PropertyKey, unknown>;

				for (const listener of listeners) {
					const handler = instanceMethods[listener.methodName];

					if (typeof handler !== 'function') {
						throw new TypeError(
							`BullMQ handler ${exportedItem.name}.${String(listener.methodName)} is not a function.`
						);
					}

					const queue = new Queue(listener.job.name, {
						connection: {
							host: process.env.REDIS_HOST,
							port: Number(process.env.REDIS_PORT),
							username: process.env.REDIS_USERNAME,
							password: process.env.REDIS_PASSWORD,
							db: Number(process.env.REDIS_BULL_DB)
						},
						defaultJobOptions: {
							removeOnComplete: {
								age: 48 * 60 * 60,
								count: 100
							},
							removeOnFail: {
								age: 7 * 24 * 60 * 60
							}
						}
					});

					if (listener.options?.repeat) {
						await queue.upsertJobScheduler(listener.job.name, listener.options.repeat);
					}

					this.jobsInstances.push({
						queue,
						definition: listener.job,
						handle: handler.bind(instance) as BullJobHandler,
						options: listener.options
					});
				}
			}
		}

		this.initHandlers();

		Terminal.success(
			'BULLMQ',
			`Successfully initialized queues. ${ansicolor.cyan(`(${this.jobsInstances.length} queue(s) found)`)} `
		);
	}
}

export const BullModule = new QueueModuleBase();

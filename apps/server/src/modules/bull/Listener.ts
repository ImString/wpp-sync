import type { Job, JobsOptions, RepeatOptions } from 'bullmq';

import type { AnyBullJobSchema, BullJobData } from './JobSchema.js';

export interface IBullListener {
	job: AnyBullJobSchema;
	methodName: PropertyKey;
	options?: BullListenerOptions;
}

export type BullListenerOptions = JobsOptions & {
	repeat?: Omit<RepeatOptions, 'key'>;
};

export type BullJobHandler<SJob extends AnyBullJobSchema = AnyBullJobSchema> = (
	data: BullJobData<SJob>,
	job: Job<BullJobData<SJob>>
) => Promise<unknown> | unknown;

const listenersMetadata = new WeakMap<object, IBullListener[]>();
const bullJobClasses = new WeakSet<Function>();

export function BullJob(): ClassDecorator {
	return target => {
		bullJobClasses.add(target);
	};
}

export function isBullJobClass(target: Function): boolean {
	return bullJobClasses.has(target);
}

export function getBullListeners(target: object): IBullListener[] {
	return [...(listenersMetadata.get(target) ?? [])];
}

export function BullListener<SJob extends AnyBullJobSchema>(job: SJob, options?: BullListenerOptions) {
	return <THandler extends BullJobHandler<SJob>>(
		target: object,
		methodName: PropertyKey,
		_descriptor: TypedPropertyDescriptor<THandler>
	) => {
		const listeners = getBullListeners(target);

		listeners.push({
			job,
			methodName,
			options
		});

		listenersMetadata.set(target, listeners);
	};
}

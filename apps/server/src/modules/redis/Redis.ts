import { BaseModule } from '@wppsync/backend';
import { Terminal } from '@wppsync/shared';
import { Redis } from 'ioredis';

export class RedisModuleBase extends BaseModule {
	client?: Redis;

	private initHandlers(): void {}

	async init(): Promise<void> {
		this.client = new Redis({
			db: Number(process.env.REDIS_DB ?? 0),
			host: process.env.REDIS_HOST ?? '127.0.0.1',
			port: Number(process.env.REDIS_PORT ?? 6379),
			username: process.env.REDIS_USERNAME || undefined,
			password: process.env.REDIS_PASSWORD || undefined,
			lazyConnect: true
		});

		this.client.on('connect', () => {
			Terminal.success('REDIS-CLIENT', 'Successfully connected to Redis');
		});

		this.client.on('error', error => {
			Terminal.error('REDIS-CLIENT', ['Error on connect', error]);
		});

		await this.client.connect();
		this.initHandlers();
	}

	async shutdown(): Promise<void> {
		if (!this.client) return;

		await this.client.quit();
		this.client = undefined;
	}
}

export const RedisModule = new RedisModuleBase();

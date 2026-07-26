import { Terminal } from '@wppsync/shared';

import type { BaseModule } from '../modules/Base.js';
import * as modules from '../modules/modules.js';
import { ProvidersService, type ProviderToken, type ProviderType } from './services/Providers.js';

export interface CoreOptions {
	providers?: ProviderType[];
}

export class Core {
	readonly storage = new Map<string, unknown>();
	readonly providers = new ProvidersService();

	constructor(options: CoreOptions = {}) {
		this.providers.registerInstance(Core, this);

		for (const provider of options.providers ?? []) {
			this.providers.register(provider);
		}
	}

	private async initModules() {
		const sortedModules = (Object.values(modules) as BaseModule[]).sort((a, b) => {
			if (a.dependencies?.includes(b)) return 1;
			if (b.dependencies?.includes(a)) return -1;

			return 0;
		});

		for (const module of sortedModules) {
			await module.init?.(this);
		}
	}

	async init() {
		await this.initModules();

		Terminal.success('CORE', 'Successfully initialized!');
	}

	instantiate<T>(Target: new (...args: any[]) => T): T {
		return this.providers.instantiate(Target);
	}

	resolve<T = unknown>(token: ProviderToken<T>): T | undefined {
		return this.providers.resolve(token);
	}

	resolveOrThrow<T = unknown>(token: ProviderToken<T>): T {
		return this.providers.resolveOrThrow(token);
	}
}

import { Terminal } from '@wppsync/shared';

import type { BaseModule } from '@/modules/Base.js';

import { ProvidersService, type ProviderToken, type ProviderType } from './services/Providers.js';

export interface CoreOptions {
	modules?: BaseModule[];
	providers?: ProviderType[];
}

export class Core {
	readonly storage = new Map<string, unknown>();
	readonly providers = new ProvidersService();

	private readonly modules: BaseModule[];
	private readonly initializedModules: BaseModule[] = [];

	constructor(options: CoreOptions = {}) {
		this.modules = [...(options.modules ?? [])];
		this.providers.registerInstance(Core, this);

		for (const provider of options.providers ?? []) {
			this.providers.register(provider);
		}
	}

	private sortModules(): BaseModule[] {
		const configured = new Set(this.modules);
		const visiting = new Set<BaseModule>();
		const visited = new Set<BaseModule>();
		const sorted: BaseModule[] = [];

		const visit = (module: BaseModule) => {
			if (visited.has(module)) return;
			if (visiting.has(module)) throw new Error('Circular module dependency detected.');

			visiting.add(module);

			for (const dependency of module.dependencies ?? []) {
				if (!configured.has(dependency)) {
					throw new Error(
						`Module ${module.constructor.name} depends on ${dependency.constructor.name}, but it was not registered.`
					);
				}

				visit(dependency);
			}

			visiting.delete(module);
			visited.add(module);
			sorted.push(module);
		};

		for (const module of this.modules) visit(module);

		return sorted;
	}

	async init(): Promise<void> {
		try {
			for (const module of this.sortModules()) {
				this.initializedModules.push(module);
				await module.init(this);
			}
		} catch (error) {
			await this.shutdown();
			throw error;
		}

		Terminal.success('CORE', 'Successfully initialized!');
	}

	async shutdown(): Promise<void> {
		for (const module of [...this.initializedModules].reverse()) {
			await module.shutdown?.();
		}

		this.initializedModules.length = 0;
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

import { PROVIDER_METADATA_KEY } from '@/core/decorators/provider.js';

export type ProviderClass<T = unknown> = new (...args: any[]) => T;
export type ProviderToken<T = unknown> = string | symbol | ProviderClass<T>;

export interface ClassProvider<T = unknown> {
	provide: ProviderToken<T>;
	useClass: ProviderClass<T>;
}

export interface ValueProvider<T = unknown> {
	provide: ProviderToken<T>;
	useValue: T;
}

export type ProviderType<T = unknown> = ProviderClass<T> | ClassProvider<T> | ValueProvider<T>;

export class ProvidersService {
	private readonly providers = new Map<ProviderToken, unknown>();
	private readonly resolving = new Set<ProviderToken>();

	resolve<T = unknown>(token: ProviderToken<T>): T | undefined {
		if (this.providers.has(token)) return this.providers.get(token) as T;

		if (typeof token === 'function' && Reflect.getMetadata(PROVIDER_METADATA_KEY.PROVIDER, token)) {
			return this.register(token);
		}

		return undefined;
	}

	resolveOrThrow<T = unknown>(token: ProviderToken<T>): T {
		const provider = this.resolve(token);

		if (provider === undefined && !this.providers.has(token)) {
			throw new Error(`Provider for token ${this.formatToken(token)} was not found.`);
		}

		return provider as T;
	}

	registerInstance<T>(token: ProviderToken<T>, instance: T): T {
		this.providers.set(token, instance);
		return instance;
	}

	register<T>(provider: ProviderType<T>): T {
		if (this.isValueProvider(provider)) {
			return this.registerInstance(provider.provide, provider.useValue);
		}

		if (this.isClassProvider(provider)) {
			if (this.providers.has(provider.provide)) return this.providers.get(provider.provide) as T;

			return this.createSingleton(provider.provide, provider.useClass);
		}

		if (!Reflect.getMetadata(PROVIDER_METADATA_KEY.PROVIDER, provider)) {
			throw new Error(
				`The class ${provider.name} is not a valid provider. Did you forget the @Provider() decorator?`
			);
		}

		if (this.providers.has(provider)) return this.providers.get(provider) as T;

		return this.createSingleton(provider, provider);
	}

	instantiate<T>(Target: ProviderClass<T>): T {
		const paramTypes = (Reflect.getMetadata(PROVIDER_METADATA_KEY.PARAM_TYPES, Target) ?? []) as ProviderToken[];
		const injections = (Reflect.getOwnMetadata(PROVIDER_METADATA_KEY.INJECT, Target) ?? {}) as Record<
			number,
			ProviderToken
		>;
		const injectionIndexes = Object.keys(injections).map(Number);
		const parameterCount = Math.max(
			Target.length,
			paramTypes.length,
			...injectionIndexes.map(index => index + 1),
			0
		);
		const dependencies = Array.from({ length: parameterCount }, (_, index) => {
			const token = injections[index] ?? paramTypes[index];

			if (token === undefined) {
				throw new Error(
					`Cannot resolve parameter #${index} of ${Target.name}. Add @Inject(token) or enable emitDecoratorMetadata.`
				);
			}

			return this.resolveOrThrow(token);
		});

		return new Target(...dependencies);
	}

	unregister(token: ProviderToken): boolean {
		return this.providers.delete(token);
	}

	private createSingleton<T>(token: ProviderToken<T>, Target: ProviderClass<T>): T {
		if (this.resolving.has(token)) {
			throw new Error(`Circular provider dependency detected while resolving ${this.formatToken(token)}.`);
		}

		this.resolving.add(token);

		try {
			const instance = this.instantiate(Target);
			this.providers.set(token, instance);
			return instance;
		} finally {
			this.resolving.delete(token);
		}
	}

	private formatToken(token: ProviderToken): string {
		if (typeof token === 'function') return token.name;
		return String(token);
	}

	private isValueProvider<T>(provider: ProviderType<T>): provider is ValueProvider<T> {
		return typeof provider === 'object' && provider !== null && 'useValue' in provider;
	}

	private isClassProvider<T>(provider: ProviderType<T>): provider is ClassProvider<T> {
		return typeof provider === 'object' && provider !== null && 'useClass' in provider;
	}
}

export default { ProvidersService };

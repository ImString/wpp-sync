export const PROVIDER_METADATA_KEY = {
	PROVIDER: 'wppsync:provider',
	INJECT: 'wppsync:inject',
	PARAM_TYPES: 'design:paramtypes'
} as const;

export function Provider(): ClassDecorator {
	return target => {
		Reflect.defineMetadata(PROVIDER_METADATA_KEY.PROVIDER, true, target);
	};
}

export function Inject(token: unknown): ParameterDecorator {
	return (target, _propertyKey, parameterIndex) => {
		const injections = {
			...(Reflect.getOwnMetadata(PROVIDER_METADATA_KEY.INJECT, target) as Record<number, unknown> | undefined)
		};

		injections[parameterIndex] = token;
		Reflect.defineMetadata(PROVIDER_METADATA_KEY.INJECT, injections, target);
	};
}

export default { Inject, Provider };

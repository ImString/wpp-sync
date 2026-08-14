import { ROUTER_MIDDLEWARE_ROLE, ROUTER_ROLE_METADATA_KEY } from '@/modules/router/constants/router.js';
import { getOwnMetadata } from '@/modules/router/metadata.js';
import type { MiddlewareVariant, MountedMiddleware, RouterMiddlewareClass } from '@/modules/router/types/index.js';

export class MiddlewareUtils {
	static processMiddlewareVariant(variant: MiddlewareVariant): MountedMiddleware {
		let MiddlewareConstructor: RouterMiddlewareClass;

		if (typeof variant === 'function') {
			MiddlewareConstructor = variant;
		} else {
			MiddlewareConstructor = variant.constructor;
		}

		const middlewareRole = getOwnMetadata<string>(ROUTER_ROLE_METADATA_KEY, MiddlewareConstructor);

		if (middlewareRole !== ROUTER_MIDDLEWARE_ROLE)
			throw new Error(
				`The class ${MiddlewareConstructor.name} is not a valid middleware. Did you forget the @Middleware() decorator?`
			);

		if (typeof variant === 'function') {
			return (variant as RouterMiddlewareClass).configure({});
		}

		return variant as MountedMiddleware;
	}
}

export default { MiddlewareUtils };

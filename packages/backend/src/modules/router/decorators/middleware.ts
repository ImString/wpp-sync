import { Terminal } from '@wppsync/shared';

import {
	ROUTER_LOAD_ERROR_METADATA_KEY,
	ROUTER_MIDDLEWARE_ROLE,
	ROUTER_MIDDLEWARES_METADATA_KEY,
	ROUTER_ROLE_METADATA_KEY
} from '@/modules/router/constants/index.js';
import { defineMetadata, getOwnMetadata } from '@/modules/router/metadata.js';
import type { MiddlewareVariant, MountedMiddleware } from '@/modules/router/types/index.js';
import { MiddlewareUtils } from '@/modules/router/utils/index.js';

export function Middleware(): ClassDecorator {
	return target => {
		defineMetadata(ROUTER_ROLE_METADATA_KEY, ROUTER_MIDDLEWARE_ROLE, target);
	};
}

export function UseMiddleware(...middlewares: MiddlewareVariant[]): MethodDecorator {
	return (target, propertyKey) => {
		const controller = typeof target === 'function' ? target : target.constructor;
		const middlewareList = [
			...(getOwnMetadata<MountedMiddleware[]>(ROUTER_MIDDLEWARES_METADATA_KEY, controller) ?? [])
		];

		for (const middleware of middlewares) {
			try {
				const mountedMiddleware = MiddlewareUtils.processMiddlewareVariant(middleware);

				middlewareList.push({ ...mountedMiddleware, handlerName: propertyKey });
			} catch (error: unknown) {
				defineMetadata(ROUTER_LOAD_ERROR_METADATA_KEY, true, controller);

				if (error instanceof Error) Terminal.error('ROUTER', error.message);
				else
					Terminal.error(
						'ROUTER',
						`An unknown error occurred while applying middleware. (${controller.name} - ${middleware})`
					);
			}
		}

		defineMetadata(ROUTER_MIDDLEWARES_METADATA_KEY, middlewareList, controller);
	};
}

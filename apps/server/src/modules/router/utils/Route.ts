import type { AnyRouteSchema } from '@/modules/router/components/RouteSchema.js';
import { ROUTER_MIDDLEWARES_METADATA_KEY, ROUTER_ROUTES_METADATA_KEY } from '@/modules/router/constants/router.js';
import { defineMetadata, getOwnMetadata } from '@/modules/router/metadata.js';
import type { ControllerClass } from '@/modules/router/types/controller.js';
import type { MountedMiddleware } from '@/modules/router/types/middleware.js';
import type { MountedRoute, RouteMethod } from '@/modules/router/types/route.js';

export class RouteUtils {
	static processMetadata(
		method: RouteMethod,
		path: string,
		handlerName: PropertyKey,
		controller: ControllerClass,
		schema?: AnyRouteSchema
	) {
		const controllerRoutesMetadata = [
			...(getOwnMetadata<MountedRoute[]>(ROUTER_ROUTES_METADATA_KEY, controller) ?? [])
		];
		const controllerMiddlewaresMetadata =
			getOwnMetadata<MountedMiddleware[]>(ROUTER_MIDDLEWARES_METADATA_KEY, controller) ?? [];

		const routeMiddlewares = controllerMiddlewaresMetadata
			.filter(middleware => middleware.handlerName === handlerName)
			.reverse()
			.map(({ handlerName: _handlerName, ...middleware }) => middleware);

		const mountedRoute: MountedRoute = {
			method,
			path,
			handlerName,
			schema,
			middlewares: routeMiddlewares
		};

		controllerRoutesMetadata.push(mountedRoute);

		const filteredControllerMiddlewaresMetadata = controllerMiddlewaresMetadata.filter(
			middleware => middleware.handlerName !== handlerName
		);
		defineMetadata(ROUTER_MIDDLEWARES_METADATA_KEY, filteredControllerMiddlewaresMetadata, controller);

		defineMetadata(ROUTER_ROUTES_METADATA_KEY, controllerRoutesMetadata, controller);
	}
}

export default { RouteUtils };

import type { AnyRouteSchema } from '@/modules/router/components/RouteSchema.js';
import type { MountedMiddleware } from '@/modules/router/types/middleware.js';

export type RouteMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface MountedRoute {
	path: string;
	method: RouteMethod;
	handlerName: PropertyKey;
	schema?: AnyRouteSchema;
	middlewares?: MountedMiddleware[];
}

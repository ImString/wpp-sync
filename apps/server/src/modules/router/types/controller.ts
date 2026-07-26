import type { MountedMiddleware } from '@/modules/router/types/middleware.js';
import type { MountedRoute } from '@/modules/router/types/route.js';

export type ControllerClass<T extends object = object> = new (...args: any[]) => T;

export interface MountedController {
	path: string;
	middlewares: MountedMiddleware[];
	constructor: ControllerClass;
}

export interface DefinedController {
	data: MountedController;
	routes: MountedRoute[];
}

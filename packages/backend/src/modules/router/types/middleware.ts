import type { RouterMiddleware } from '@/modules/router/components/Middleware.js';
import type {
	RouterGlobalRequest,
	RouterGlobalResponse,
	RouterGlobalState
} from '@/modules/router/components/RouteSchema.js';

export type RouterMiddlewareClass<T extends RouterMiddleware = RouterMiddleware> = {
	new (...args: any[]): T;
	configure: (options: any) => MountedMiddleware<any>;
};

export type MountedMiddleware<T = any> = {
	constructor: RouterMiddlewareClass<any>;
	options: T;
	handlerName?: PropertyKey;
	isPrimary?: boolean;
};

export type MiddlewareVariant = RouterMiddlewareClass | MountedMiddleware;

export interface RouterMiddlewareContext<
	SRequest = RouterGlobalRequest,
	SResponse = RouterGlobalResponse,
	SState = RouterGlobalState
> {
	request: SRequest;
	response: SResponse;
	state: SState;

	body: any;
	query: any;
	params: any;
}

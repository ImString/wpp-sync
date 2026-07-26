import type { AnyRouteSchema } from '@/modules/router/components/RouteSchema.js';
import type { ControllerClass } from '@/modules/router/types/controller.js';
import type { RouteMethod } from '@/modules/router/types/route.js';
import { RouteUtils } from '@/modules/router/utils/Route.js';

function createRouteDecorator(method: RouteMethod, path: string, schema?: AnyRouteSchema): MethodDecorator {
	return (target, propertyKey) => {
		const controller = (typeof target === 'function' ? target : target.constructor) as ControllerClass;

		RouteUtils.processMetadata(method, path, propertyKey, controller, schema);
	};
}

export function Get(path: string = '', schema?: AnyRouteSchema): MethodDecorator {
	return createRouteDecorator('GET', path, schema);
}

export function Post(path: string = '', schema?: AnyRouteSchema): MethodDecorator {
	return createRouteDecorator('POST', path, schema);
}

export function Put(path: string = '', schema?: AnyRouteSchema): MethodDecorator {
	return createRouteDecorator('PUT', path, schema);
}

export function Delete(path: string = '', schema?: AnyRouteSchema): MethodDecorator {
	return createRouteDecorator('DELETE', path, schema);
}

export function Patch(path: string = '', schema?: AnyRouteSchema): MethodDecorator {
	return createRouteDecorator('PATCH', path, schema);
}

export function Options(path: string = '', schema?: AnyRouteSchema): MethodDecorator {
	return createRouteDecorator('OPTIONS', path, schema);
}

export function Head(path: string = '', schema?: AnyRouteSchema): MethodDecorator {
	return createRouteDecorator('HEAD', path, schema);
}

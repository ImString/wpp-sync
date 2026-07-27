import { Validator } from '@wppsync/shared';
import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest, FastifySchema } from 'fastify';

import { ProvidersService } from '@/core/services/Providers.js';

import { RouterModule, type RouterModuleOptions } from '@/modules/router/Module.js';
import { HttpResponse } from '@/modules/router/components/HttpResponse.js';
import type { AnyRouteSchema } from '@/modules/router/components/RouteSchema.js';
import type { DefinedController } from '@/modules/router/types/controller.js';
import type { MountedMiddleware, RouterMiddlewareContext } from '@/modules/router/types/middleware.js';
import type { MountedRoute } from '@/modules/router/types/route.js';

import type { MemberEntity } from '@/entities/data/workspaces/members.entity.js';
import type { WorkspaceEntity } from '@/entities/data/workspaces/workspace.entity.js';

export interface RouterState extends Record<PropertyKey, unknown> {
	userId: string;
	workspaceAccess?: {
		workspace: WorkspaceEntity;
		membership: MemberEntity;
	};
}

declare module '@/modules/router/components/RouteSchema.js' {
	interface RouterGlobalInputs {
		request: FastifyRequest;
		response: FastifyReply;
		state: RouterState;
	}
}

export interface FastifyRoutesOptions extends RouterModuleOptions {
	providers?: ProvidersService;
}

type ValidationSource = 'body' | 'query' | 'params';

function joinRoutePaths(controllerPath: string, routePath: string): string {
	const path = [controllerPath, routePath]
		.map(segment => segment.replace(/^\/+|\/+$/g, ''))
		.filter(Boolean)
		.join('/');

	return path ? `/${path}` : '/';
}

function createContext(request: FastifyRequest, reply: FastifyReply): RouterMiddlewareContext {
	return {
		request,
		response: reply,
		state: {
			userId: ''
		},
		body: request.body,
		query: request.query,
		params: request.params
	};
}

function sendHttpResponse(reply: FastifyReply, response: HttpResponse): FastifyReply {
	return reply.status(response.status).send(response.toObject());
}

async function validateRequest(
	request: FastifyRequest,
	reply: FastifyReply,
	schema: AnyRouteSchema
): Promise<FastifyReply | undefined> {
	const validators = schema.validators;
	const inputs = [
		['body', validators.body],
		['query', validators.query],
		['params', validators.params]
	] as const;

	for (const [source, validator] of inputs) {
		if (!validator) continue;
		if (source === 'body' && schema.form && request.isMultipart()) continue;

		const result = await Validator.validate(validator, request[source]);

		if (!result.success) {
			return sendHttpResponse(
				reply,
				HttpResponse.error('BAD_REQUEST', 'VALIDATION_ERROR', {
					source,
					errors: result.errors
				})
			);
		}

		request[source] = result.data;
	}

	return undefined;
}

async function executeMiddlewares(
	middlewares: MountedMiddleware[],
	context: RouterMiddlewareContext,
	reply: FastifyReply,
	providers: ProvidersService
): Promise<FastifyReply | undefined> {
	for (const mountedMiddleware of middlewares) {
		const middleware = providers.instantiate(mountedMiddleware.constructor);
		const result = await middleware.execute(context, mountedMiddleware.options);

		if (result instanceof HttpResponse) return sendHttpResponse(reply, result);
		if (reply.sent) return reply;
	}

	return undefined;
}

function registerRoute(
	fastify: FastifyInstance,
	controller: DefinedController,
	controllerInstance: Record<PropertyKey, unknown>,
	route: MountedRoute,
	providers: ProvidersService
) {
	const ControllerConstructor = controller.data.constructor;
	const handler = controllerInstance[route.handlerName];

	if (typeof handler !== 'function') {
		throw new TypeError(
			`Route handler ${ControllerConstructor.name}.${String(route.handlerName)} is not a function.`
		);
	}

	const middlewares = [...controller.data.middlewares, ...(route.middlewares ?? [])];
	const contexts = new WeakMap<FastifyRequest, RouterMiddlewareContext>();

	fastify.route({
		method: route.method,
		url: joinRoutePaths(controller.data.path, route.path),
		...(Object.keys(route.schema?.meta ?? {}).length > 0 && {
			schema: route.schema?.meta as FastifySchema
		}),
		...(route.schema && {
			preValidation: async (request, reply) => validateRequest(request, reply, route.schema!)
		}),
		...(middlewares.length > 0 && {
			preHandler: async (request, reply) => {
				const context = createContext(request, reply);
				contexts.set(request, context);

				return executeMiddlewares(middlewares, context, reply, providers);
			}
		}),
		handler: async (request, reply) => {
			const context = contexts.get(request) ?? createContext(request, reply);
			contexts.delete(request);

			const result = await handler.call(controllerInstance, context);

			if (result instanceof HttpResponse) return sendHttpResponse(reply, result);
			if (reply.sent) return reply;

			return result;
		}
	});
}

export const routes: FastifyPluginAsync<FastifyRoutesOptions> = async (fastify, options) => {
	const router = new RouterModule(options);
	const controllers = await router.load();
	const providers = options.providers ?? new ProvidersService();

	for (const controller of controllers) {
		const controllerInstance = providers.instantiate(controller.data.constructor) as Record<PropertyKey, unknown>;

		for (const route of controller.routes) {
			registerRoute(fastify, controller, controllerInstance, route, providers);
		}
	}
};

export default routes;

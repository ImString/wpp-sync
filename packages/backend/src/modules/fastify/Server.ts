import fastify, {
	type FastifyError,
	type FastifyInstance,
	type FastifyListenOptions,
	type FastifyReply,
	type FastifyRequest,
	type FastifyServerOptions
} from 'fastify';

import type { Core } from '@/core/Core.js';

import { BaseModule } from '@/modules/Base.js';

import { ServerError, ServerResponse } from './models/index.js';
import routes, { type FastifyRoutesOptions } from './routes.js';

export interface FastifyServerModuleOptions {
	listen: FastifyListenOptions;
	server?: FastifyServerOptions;
	router?: FastifyRoutesOptions;
	dependencies?: BaseModule[];
	configure?: (server: FastifyInstance, core: Core) => void | Promise<void>;
	errorHandler?: (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => unknown | Promise<unknown>;
	notFoundHandler?: (request: FastifyRequest, reply: FastifyReply) => unknown | Promise<unknown>;
	onListening?: (server: FastifyInstance) => void | Promise<void>;
}

export class FastifyServerModule extends BaseModule {
	server?: FastifyInstance;

	constructor(private readonly options: FastifyServerModuleOptions) {
		super({ dependencies: options.dependencies });
	}

	private configureHandlers(): void {
		if (!this.server) return;

		this.server.setNotFoundHandler(
			this.options.notFoundHandler ??
				((_request, reply) =>
					reply.status(404).send({
						success: false,
						code: 'NOT_FOUND',
						data: {}
					}))
		);

		this.server.setErrorHandler(async (error, request, reply) => {
			const fastifyError = error as FastifyError;

			if (this.options.errorHandler) {
				const response = await this.options.errorHandler(fastifyError, request, reply);
				if (reply.sent || response !== undefined) return response;
			}

			if (error instanceof ServerError) return reply.status(error.status).send(error.toJSON());
			if (error instanceof ServerResponse) return reply.status(error.status).send(error.toObject());

			return reply.status(fastifyError.statusCode ?? 500).send({
				success: false,
				code: fastifyError.code ?? 'INTERNAL_SERVER_ERROR',
				data: { message: fastifyError.message }
			});
		});
	}

	async init(core: Core): Promise<void> {
		this.server = fastify(this.options.server);

		await this.options.configure?.(this.server, core);

		this.configureHandlers();

		await this.server.register(routes, {
			...this.options.router,
			providers: this.options.router?.providers ?? core.providers
		});

		await this.server.listen(this.options.listen);
		await this.options.onListening?.(this.server);
	}

	async shutdown(): Promise<void> {
		await this.server?.close();
		this.server = undefined;
	}
}

export function createFastifyServerModule(options: FastifyServerModuleOptions): FastifyServerModule {
	return new FastifyServerModule(options);
}

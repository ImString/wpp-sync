import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import { config, Terminal } from '@wppsync/shared';
import ansicolor from 'ansicolor';
import fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { fileURLToPath } from 'node:url';

import type { Core } from '@/core/Core.js';

import { BaseModule } from '@/modules/Base.js';
import { mapApplicationError } from '@/modules/fastify/ApplicationErrorMapper.js';
import { ServerError, ServerResponse } from '@/modules/fastify/models/index.js';
import routes from '@/modules/fastify/plugins/routes.js';

import { ApplicationError } from '@/entities/errors/index.js';

export class ServerModuleBase extends BaseModule {
	server?: FastifyInstance;

	initHandlers() {
		if (!this.server) return;

		this.server.setNotFoundHandler((request, reply) => {
			reply.status(404).send({
				success: false,
				code: 'NOT_FOUND',
				data: {}
			});
		});

		this.server.setErrorHandler((error, request, reply) => {
			if (error instanceof ApplicationError) {
				const response = mapApplicationError(error);
				return reply.status(response.status).send(response.toObject());
			}

			if (error instanceof ServerError) return reply.status(error.status).send(error.toJSON());
			if (error instanceof ServerResponse) return reply.status(error.status).send(error.toObject());

			if (process.env.MODE === 'development') console.error(error);

			const fastifyError = error instanceof Error ? (error as FastifyError) : undefined;

			if (fastifyError?.statusCode === 401) {
				reply.code(401).send({ was: 'unauthorized' });
				return;
			}

			reply.status(500).send({
				success: false,
				code: fastifyError?.code || 'INTERNAL_SERVER_ERROR',
				data: { message: fastifyError?.message || 'An unknown error occurred' }
			});
		});
	}

	async init(core: Core) {
		this.server = fastify({
			logger: false
		});

		this.server
			.register(fastifyCors, {
				origin: '*',
				allowedHeaders: ['Content-Type', 'Authorization'],

				methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS']
			})
			.register(fastifyHelmet, {})
			.register(fastifyMultipart, { limits: { fileSize: 55e6 } })
			.register(routes, {
				providers: core.providers,
				loader: {
					path: fileURLToPath(new URL('../../handlers/controllers', import.meta.url))
				}
			});

		this.initHandlers();

		await this.server.listen({
			...(process.env.MODE === 'development' && { host: '0.0.0.0' }),
			port: config.server.port
		});

		Terminal.success('SERVER', `Successfully initialized on port: ${ansicolor.cyan(config.server.port)}`);
	}
}

export const ServerModule = new ServerModuleBase();

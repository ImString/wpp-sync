import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import { createFastifyServerModule } from '@wppsync/backend';
import { config, Terminal } from '@wppsync/shared';
import ansicolor from 'ansicolor';
import { fileURLToPath } from 'node:url';

import { mapApplicationError } from '@/modules/fastify/ApplicationErrorMapper.js';

import { ApplicationError } from '@/entities/errors/index.js';

export const ServerModule = createFastifyServerModule({
	listen: {
		...(process.env.MODE === 'development' && { host: '0.0.0.0' }),
		port: config.server.port
	},
	server: {
		logger: false
	},
	router: {
		loader: {
			pattern: /\.controller\.(?:[cm]?[jt]s)$/,
			path: fileURLToPath(new URL('../../handlers/controllers', import.meta.url))
		}
	},
	configure(server) {
		server
			.register(fastifyCors, {
				origin: '*',
				allowedHeaders: ['Content-Type', 'Authorization'],
				methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
			})
			.register(fastifyHelmet, {})
			.register(fastifyMultipart, { limits: { fileSize: 55e6 } });
	},
	notFoundHandler(request, reply) {
		if (request.raw.url?.startsWith('/socket.io')) return;

		return reply.status(404).send({
			success: false,
			code: 'NOT_FOUND',
			data: {}
		});
	},
	errorHandler(error, _request, reply) {
		if (error instanceof ApplicationError) {
			const response = mapApplicationError(error);
			return reply.status(response.status).send(response.toObject());
		}

		if (process.env.MODE === 'development') console.error(error);

		if (error.statusCode === 401) {
			return reply.code(401).send({ was: 'unauthorized' });
		}

		if (error.code === 'P1001') {
			Terminal.error('SERVER', [
				'Has error in database:',
				'\n----------------------',
				error.message,
				'\n----------------------'
			]);

			return reply.code(500).send({
				success: false,
				code: 'DATABASE_ERROR',
				data: { message: 'A database error occurred.' }
			});
		}

		return undefined;
	},
	onListening() {
		Terminal.success('SERVER', `Successfully initialized on port: ${ansicolor.cyan(config.server.port)}`);
	}
});

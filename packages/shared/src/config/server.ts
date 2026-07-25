import * as client from './client.js';

export const port = Number(process.env.SERVER_PORT || 3e3);

export type CorsConfig = import('@fastify/cors').FastifyCorsOptions;

export const cors: CorsConfig = {
	origin: [client.fullUrl]
};

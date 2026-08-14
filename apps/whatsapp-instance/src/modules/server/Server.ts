import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import { createFastifyServerModule } from '@wppsync/backend';
import { Terminal } from '@wppsync/shared';

import { environment } from '@/config/index.js';
import { HealthController } from '@/handlers/controllers/health.controller.js';
import { InstanceController } from '@/handlers/controllers/instance.controller.js';
import { MessagesController } from '@/handlers/controllers/messages.controller.js';
import { WhatsAppModule } from '@/modules/whatsapp/index.js';

export const ServerModule = createFastifyServerModule({
	dependencies: [WhatsAppModule],
	listen: {
		host: environment.host,
		port: environment.port
	},
	server: {
		logger: false
	},
	router: {
		controllers: [HealthController, InstanceController, MessagesController]
	},
	configure(server) {
		server.register(fastifyHelmet, {}).register(fastifyMultipart, {
			limits: { fileSize: 16 * 1024 * 1024 }
		});
	},
	onListening() {
		Terminal.success('SERVER', `WhatsApp instance listening on ${environment.host}:${environment.port}.`);
	}
});

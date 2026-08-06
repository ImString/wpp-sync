import z from 'zod';

import { SocketEventSchema } from '@/modules/index.js';

export namespace IntegrationSocketDTO {
	export const Update = new SocketEventSchema({
		name: 'integration:update',
		data: z
			.object({
				integrationId: z.string().min(1),
				status: z.enum(['INITIALIZING', 'AWAITING_LOGIN', 'CONNECTED', 'DISCONNECTED']).optional(),
				name: z.string().optional(),
				type: z.enum(['WHATSAPP', 'WEB']).optional()
			})
			.strict()
	});
}

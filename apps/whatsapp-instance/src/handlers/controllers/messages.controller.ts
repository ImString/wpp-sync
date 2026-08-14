import { Controller, HttpResponse, Post, RouteSchema, ServerError } from '@wppsync/backend';
import { z } from 'zod';

import { InternalAuthenticationMiddleware } from '@/handlers/middlewares/internal-authentication.js';
import { WhatsAppModuleBase } from '@/modules/whatsapp/index.js';

const SendTextSchema = new RouteSchema({
	body: z.object({
		phone: z.string().min(8),
		message: z.string().min(1).max(4096)
	})
});

@Controller({
	path: '/messages',
	middlewares: [InternalAuthenticationMiddleware]
})
export class MessagesController {
	constructor(private readonly whatsapp: WhatsAppModuleBase) {}

	@Post('/send-text', SendTextSchema)
	async sendText(context: typeof SendTextSchema.context) {
		try {
			const response = await this.whatsapp.sendText(context.body.phone, context.body.message);

			return HttpResponse.success({ key: response?.key });
		} catch (error) {
			throw new ServerError(503, 'WHATSAPP_SEND_FAILED', {
				message: error instanceof Error ? error.message : 'Failed to send WhatsApp message.'
			});
		}
	}
}

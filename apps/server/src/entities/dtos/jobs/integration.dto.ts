import z from 'zod';

import { BullJobSchema } from '@/modules/index.js';

export namespace IntegrationJobDTO {
	export const WebCreate = new BullJobSchema({
		name: 'web.create',
		data: z.object({
			integrationId: z.string()
		})
	});

	export const WhatsappCreate = new BullJobSchema({
		name: 'whatsapp.create',
		data: z.object({
			integrationId: z.string()
		})
	});
}

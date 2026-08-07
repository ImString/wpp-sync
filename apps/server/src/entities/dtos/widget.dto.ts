import z from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace WidgetDTO {
	export const Start = new RouteSchema({
		params: z.object({
			integrationId: z.string()
		}),
		body: z.object({
			name: z.string().trim().min(1).max(100),
			email: z.string().trim().toLowerCase().email().max(254)
		})
	});
}

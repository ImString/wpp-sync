import z from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace ConversationDTO {
	const SendFields = z
		.object({
			text: z.coerce.string().trim().min(1).max(1000).optional(),
			signature: z.boolean().optional()
		})
		.strict();

	export const List = new RouteSchema({
		query: z.object({
			search: z.string().optional(),
			page: z.coerce.number().min(1).optional(),
			limit: z.coerce.number().min(1).max(100).optional()
		})
	});

	export const Send = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		}),
		body: SendFields,
		form: {
			fields: SendFields,
			options: {
				limits: {
					fields: 2,
					files: 10,
					parts: 12,
					fileSize: 55 * 1024 * 1024
				}
			}
		}
	});

	export const Close = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		})
	});
}

import z from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace ConversationMessagesDTO {
	export const List = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		}),
		query: z.object({
			cursor: z.coerce.number().min(1).optional(),
			limit: z.coerce.number().min(1).max(100).optional()
		})
	});

	export const Send = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		}),
		body: z.object({
			message: z.string().trim().min(1).max(1000)
		})
	});
}

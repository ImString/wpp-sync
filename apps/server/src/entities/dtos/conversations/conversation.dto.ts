import z from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace ConversationDTO {
	export const List = new RouteSchema({
		query: z.object({
			search: z.string().optional(),
			page: z.coerce.number().min(1).optional(),
			limit: z.coerce.number().min(1).max(100).optional()
		})
	});
}

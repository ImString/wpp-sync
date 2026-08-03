import z from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace WorksapceMemberDTO {
	export const List = new RouteSchema({
		query: z.object({
			name: z.string().optional()
		})
	});

	export const Get = new RouteSchema({
		params: z.object({
			uid: z.string(),
			memberId: z.string()
		})
	});
}

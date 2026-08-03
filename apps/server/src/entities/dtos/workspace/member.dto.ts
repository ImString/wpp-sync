import { Role } from '@wppsync/database';
import z from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace WorkspaceMemberDTO {
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

	export const Update = new RouteSchema({
		params: z.object({
			uid: z.string(),
			memberId: z.string()
		}),
		body: z.object({
			role: z.nativeEnum(Role)
		})
	});

	export const Remove = new RouteSchema({
		params: z.object({
			uid: z.string(),
			memberId: z.string()
		})
	});
}

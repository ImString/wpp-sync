import { Role } from '@wppsync/database';
import z from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace WorkspaceInviteDTO {
	export const List = new RouteSchema({
		query: z.object({
			name: z.string().optional()
		})
	});

	export const Create = new RouteSchema({
		body: z.object({
			email: z.string().email(),
			role: z.nativeEnum(Role)
		}),
		params: z.object({
			inviteId: z.string()
		})
	});
}

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
		})
	});

	export const Revoke = new RouteSchema({
		params: z.object({
			uid: z.string(),
			inviteId: z.string()
		})
	});
}

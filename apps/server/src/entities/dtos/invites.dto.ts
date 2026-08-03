import z from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace InvitesDTO {
	export const Accept = new RouteSchema({
		params: z.object({
			inviteId: z.string()
		})
	});

	export const Reject = new RouteSchema({
		params: z.object({
			inviteId: z.string()
		})
	});
}

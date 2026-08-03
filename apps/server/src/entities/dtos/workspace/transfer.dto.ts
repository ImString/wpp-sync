import z from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace WorkspaceTransferDTO {
	export const Index = new RouteSchema({
		body: z.object({
			memberId: z.string()
		})
	});
}

import z from 'zod';

import { SocketEventSchema } from '@/modules/index.js';

export namespace WorkspaceSocketDTO {
	export const Join = new SocketEventSchema({
		name: 'workspace:join',
		data: z
			.object({
				workspaceUID: z.string().min(1)
			})
			.strict()
	});

	export const Leave = new SocketEventSchema({
		name: 'workspace:leave',
		data: z.undefined()
	});
}

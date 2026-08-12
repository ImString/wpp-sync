import z from 'zod';

import { SocketEventSchema } from '@/modules/index.js';

export namespace ConversationSocketDTO {
	export const Join = new SocketEventSchema({
		name: 'conversation:join',
		data: z
			.object({
				conversationID: z.string().min(1).optional(),
				workspaceUID: z.string().min(1)
			})
			.strict()
	});

	export const Leave = new SocketEventSchema({
		name: 'conversation:leave',
		data: z.object({}).strict()
	});

	export const New = new SocketEventSchema({
		name: 'conversation:new',
		data: z
			.object({
				conversation: z.object({})
			})
			.strict()
	});

	export const Closed = new SocketEventSchema({
		name: 'conversation:closed',
		data: z
			.object({
				conversationId: z.string().min(1)
			})
			.strict()
	});

	export const ReceiveMessage = new SocketEventSchema({
		name: 'conversation:receiveMessage',
		data: z
			.object({
				conversation: z.object({}),
				message: z.object({})
			})
			.strict()
	});
}

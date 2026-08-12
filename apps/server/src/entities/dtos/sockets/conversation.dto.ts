import z from 'zod';

import { SocketEventSchema } from '@/modules/index.js';

export namespace ConversationSocketDTO {
	export const Join = new SocketEventSchema({
		name: 'conversation:join',
		data: z
			.object({
				conversationID: z.string().min(1),
				workspaceUID: z.string().min(1)
			})
			.strict()
	});

	export const Leave = new SocketEventSchema({
		name: 'conversation:leave',
		data: z.object({}).strict()
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

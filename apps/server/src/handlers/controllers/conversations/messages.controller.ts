import { Controller, Get, HttpResponse, Post } from '@/modules/index.js';

import { ConversationParticipantService, ConversationService, MessageService } from '@/services/index.js';

import { ConversationMessagesDTO } from '@/entities/dtos/conversations/messages.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/conversations/:dataId/messages',
	middlewares: [AuthenticationMiddleware, WorkspaceAccessMiddleware]
})
export class MessagesController {
	constructor(
		private readonly conversationService: ConversationService,
		private readonly participantService: ConversationParticipantService,
		private readonly messageService: MessageService
	) {}

	@Get('/', ConversationMessagesDTO.List)
	async list(context: typeof ConversationMessagesDTO.List.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const conversation = await this.conversationService.get({
			id: context.params.dataId,
			workspace: workspace.id
		});

		const messages = await this.messageService.list({
			conversationId: conversation.id,
			cursor: context.query.cursor,
			limit: context.query.limit,
			workspace: workspace.id
		});

		return HttpResponse.success(messages);
	}

	@Post('/send', ConversationMessagesDTO.Send)
	async send(context: typeof ConversationMessagesDTO.Send.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		const membership = context.state.workspaceAccess?.membership;
		if (!workspace || !membership) throw new WorkspaceNotFoundError();

		const conversation = await this.conversationService.get({
			id: context.params.dataId,
			workspace: workspace.id
		});

		const sender = await this.participantService.joinMember({
			conversation,
			member: membership
		});

		const message = await this.messageService.sendMessage({
			conversation,
			sender,
			type: 'TEXT',
			text: context.body.message,
			workspace: workspace.id
		});

		return HttpResponse.success(
			await message.toObject({
				sign_files: true
			})
		);
	}
}

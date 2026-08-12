import { Controller, Get, HttpResponse, Post } from '@/modules/index.js';

import { ConversationParticipantService, ConversationService, MessageService } from '@/services/index.js';

import { ConversationDTO } from '@/entities/dtos/conversations/conversation.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/conversations',
	middlewares: [AuthenticationMiddleware, WorkspaceAccessMiddleware]
})
export class ConversationsController {
	constructor(
		private readonly conversationService: ConversationService,
		private readonly participantService: ConversationParticipantService,
		private readonly messageService: MessageService
	) {}

	@Get('/', ConversationDTO.List)
	async list(context: typeof ConversationDTO.List.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const conversations = await this.conversationService.list({
			search: context.query.search,
			...(context.query.page && { page: context.query.page }),
			...(context.query.limit && { limit: context.query.limit }),
			include: { integration: true },
			status: 'OPEN',
			populate_participants: true,
			populate_messages: true,
			workspace: workspace.id
		});

		return HttpResponse.success(conversations);
	}

	@Post('/:dataId/send', ConversationDTO.Send)
	async send(context: typeof ConversationDTO.Send.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		const membership = context.state.workspaceAccess?.membership;
		if (!workspace || !membership) throw new WorkspaceNotFoundError();

		const form = context.request.isMultipart()
			? await ConversationDTO.Send.toForm({ request: context.request })
			: undefined;

		const conversation = await this.conversationService.get({
			id: context.params.dataId,
			workspace: workspace.id
		});

		const sender = await this.participantService.joinMember({
			conversation,
			member: membership
		});

		const messages = await this.messageService.send({
			conversation,
			files: form?.files,
			sender,
			text: form?.fields.text ?? context.body?.text,
			workspace: workspace.id
		});

		return HttpResponse.success(await Promise.all(messages.map(message => message.toObject({ sign_files: true }))));
	}
}

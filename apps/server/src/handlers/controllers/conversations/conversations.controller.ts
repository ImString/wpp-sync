import { Controller, Get, HttpResponse } from '@/modules/index.js';

import { ConversationService } from '@/services/index.js';

import { ConversationDTO } from '@/entities/dtos/conversations/conversation.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/conversations',
	middlewares: [AuthenticationMiddleware, WorkspaceAccessMiddleware]
})
export class ConversationsController {
	constructor(private readonly conversationService: ConversationService) {}

	@Get('/', ConversationDTO.List)
	async list(context: typeof ConversationDTO.List.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const conversations = await this.conversationService.list({
			search: context.query.search,
			...(context.query.page && { page: context.query.page }),
			...(context.query.limit && { limit: context.query.limit }),
			status: 'OPEN',
			populate_participants: true,
			populate_messages: true,
			workspace: workspace.id
		});

		return HttpResponse.success(conversations);
	}
}

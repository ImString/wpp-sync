import { Controller, HttpResponse, Post } from '@/modules/index.js';

import { ConversationService, IntegrationService } from '@/services/index.js';

import { WidgetDTO } from '@/entities/dtos/widget.dto.js';
import { ConversationParticipantCreationError } from '@/entities/errors/conversation/index.js';

@Controller({
	path: '/widget/:integrationId'
})
export class WidgetController {
	constructor(
		private readonly integrationService: IntegrationService,
		private readonly conversationService: ConversationService
	) {}

	@Post('/start', WidgetDTO.Start)
	async start(context: typeof WidgetDTO.Start.context) {
		const integration = await this.integrationService.get({
			id: context.params.integrationId,
			type: 'WEB',
			status: 'CONNECTED'
		});

		const conversation = await this.conversationService.create({
			workspace: integration.data.workspaceId!,
			integration,
			participants: [
				{
					visitor: {
						name: context.body.name,
						email: context.body.email
					}
				}
			]
		});

		const visitor = conversation.entities.participants?.items.find(
			participant => participant.data.type === 'VISITOR'
		);
		if (!visitor) throw new ConversationParticipantCreationError();

		return HttpResponse.success({
			conversationId: conversation.id,
			participantId: visitor.id
		});
	}
}

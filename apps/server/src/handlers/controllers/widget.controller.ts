import { Controller, Get, HttpResponse, Post, UseMiddleware } from '@/modules/index.js';

import { AuthenticationService, ConversationService, IntegrationService, MessageService } from '@/services/index.js';

import { WidgetDTO } from '@/entities/dtos/widget.dto.js';
import { ConversationParticipantCreationError } from '@/entities/errors/conversation/index.js';

import { WidgetAuthenticationMiddleware } from '@/handlers/middlewares/widget-authentication.js';

@Controller({
	path: '/widget/:integrationId'
})
export class WidgetController {
	constructor(
		private readonly integrationService: IntegrationService,
		private readonly authenticationService: AuthenticationService,
		private readonly conversationService: ConversationService,
		private readonly messageService: MessageService
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
			integration: await integration.toObject({ sign_files: true }),
			token: this.authenticationService.generateToken(visitor.id, 'visitor')
		});
	}

	@Get('/recover', WidgetDTO.Recover)
	@UseMiddleware(WidgetAuthenticationMiddleware.configure({ optional: true }))
	async recover(context: typeof WidgetDTO.Recover.context) {
		const widgetAuthentication = context.state.widgetAuthentication!;
		const integration = widgetAuthentication.integration;
		const integrationObject = await integration.toObject({ sign_files: true });
		const conversation = widgetAuthentication.conversation;

		if (!conversation) {
			return HttpResponse.success({
				integration: integrationObject,
				messages: { items: [], hasMore: false },
				recovered: false
			});
		}

		const messages = await this.messageService.list({
			conversationId: conversation.id,
			limit: 10,
			workspace: integration.data.workspaceId!
		});

		return HttpResponse.success({
			integration: integrationObject,
			messages,
			recovered: true
		});
	}

	@Get('/messages', WidgetDTO.Messages)
	@UseMiddleware(WidgetAuthenticationMiddleware)
	async messages(context: typeof WidgetDTO.Messages.context) {
		const widgetAuthentication = context.state.widgetAuthentication!;
		const conversation = widgetAuthentication.conversation!;

		const messages = await this.messageService.list({
			conversationId: conversation.id,
			cursor: context.query.cursor,
			limit: context.query.limit,
			workspace: widgetAuthentication.integration.data.workspaceId!
		});

		return HttpResponse.success(messages);
	}

	@Post('/send', WidgetDTO.Send)
	@UseMiddleware(WidgetAuthenticationMiddleware)
	async send(context: typeof WidgetDTO.Send.context) {
		const widgetAuthentication = context.state.widgetAuthentication!;
		const conversation = widgetAuthentication.conversation!;
		const participant = widgetAuthentication.participant!;

		const form = context.request.isMultipart()
			? await WidgetDTO.Send.toForm({ request: context.request })
			: undefined;

		const messages = await this.messageService.send({
			conversation,
			files: form?.files,
			sender: participant,
			text: form?.fields.text ?? context.body?.text,
			workspace: widgetAuthentication.integration.data.workspaceId!
		});

		return HttpResponse.success(await Promise.all(messages.map(message => message.toObject({ sign_files: true }))));
	}
}

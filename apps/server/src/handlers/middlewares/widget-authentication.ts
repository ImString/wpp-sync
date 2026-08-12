import { Middleware, RouterMiddleware, type RouterMiddlewareContext } from '@/modules/index.js';

import { AuthenticationService, ConversationService, IntegrationService } from '@/services/index.js';

import { InvalidTokenError } from '@/entities/errors/authentication/index.js';
import {
	ConversationNotFoundError,
	ConversationParticipantNotFoundError
} from '@/entities/errors/conversation/index.js';
import { IntegrationNotFoundError } from '@/entities/errors/integration/IntegrationNotFoundError.js';

export interface WidgetAuthenticationMiddlewareOptions {
	optional?: boolean;
}

@Middleware()
export class WidgetAuthenticationMiddleware extends RouterMiddleware {
	static options: WidgetAuthenticationMiddlewareOptions;

	constructor(
		private readonly authenticationService: AuthenticationService,
		private readonly conversationService: ConversationService,
		private readonly integrationService: IntegrationService
	) {
		super();
	}

	async execute(context: RouterMiddlewareContext, options: WidgetAuthenticationMiddlewareOptions) {
		const integrationId = context.params?.integrationId;
		if (typeof integrationId !== 'string' || !integrationId) throw new IntegrationNotFoundError();

		const integration = await this.integrationService.get({
			id: integrationId,
			type: 'WEB',
			status: 'CONNECTED'
		});
		context.state.widgetAuthentication = { integration };

		const authorization = context.request.headers.authorization;
		const token = typeof authorization === 'string' ? authorization.replace(/^Bearer\s+/i, '').trim() : '';

		if (!token) {
			if (options.optional) return;
			throw new InvalidTokenError('Invalid or missing widget authorization token.');
		}

		try {
			const tokenPayload = this.authenticationService.verifyToken(token, 'visitor');
			const conversation = await this.conversationService.get({
				integration: integration.id,
				participantId: tokenPayload.id,
				populate_participants: true,
				status: 'OPEN',
				workspace: integration.data.workspaceId!
			});
			const participant = conversation.entities.participants?.items.find(
				item => item.id === tokenPayload.id && item.data.type === 'VISITOR'
			);
			if (!participant) throw new ConversationParticipantNotFoundError();

			context.state.widgetAuthentication = {
				conversation,
				integration,
				participant
			};
		} catch (error) {
			if (
				options.optional &&
				(error instanceof InvalidTokenError ||
					error instanceof ConversationNotFoundError ||
					error instanceof ConversationParticipantNotFoundError)
			) {
				return;
			}
			throw error;
		}
	}
}

import { ApplicationError } from '../ApplicationError.js';

export class ConversationParticipantCreationError extends ApplicationError<'CONVERSATION_PARTICIPANT_CREATION_FAILED'> {
	constructor() {
		super(
			'CONVERSATION_PARTICIPANT_CREATION_FAILED',
			'Failed to create the conversation participant.'
		);
	}
}

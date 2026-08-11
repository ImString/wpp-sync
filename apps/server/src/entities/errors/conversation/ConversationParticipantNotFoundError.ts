import { ApplicationError } from '../ApplicationError.js';

export class ConversationParticipantNotFoundError extends ApplicationError<'CONVERSATION_PARTICIPANT_NOT_FOUND'> {
	constructor() {
		super('CONVERSATION_PARTICIPANT_NOT_FOUND', 'Conversation participant not found.');
	}
}

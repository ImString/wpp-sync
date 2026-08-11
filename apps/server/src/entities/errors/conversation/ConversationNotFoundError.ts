import { ApplicationError } from '../ApplicationError.js';

export class ConversationNotFoundError extends ApplicationError<'CONVERSATION_NOT_FOUND'> {
	constructor() {
		super('CONVERSATION_NOT_FOUND', 'Conversation not found.');
	}
}

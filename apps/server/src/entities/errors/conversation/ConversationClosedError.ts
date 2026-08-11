import { ApplicationError } from '../ApplicationError.js';

export class ConversationClosedError extends ApplicationError<'CONVERSATION_CLOSED'> {
	constructor() {
		super('CONVERSATION_CLOSED', 'The conversation is closed and cannot receive new messages.');
	}
}

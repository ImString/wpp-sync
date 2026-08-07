import { ApplicationError } from '../ApplicationError.js';

export class InvalidConversationParticipantError extends ApplicationError<'INVALID_CONVERSATION_PARTICIPANT'> {
	constructor() {
		super(
			'INVALID_CONVERSATION_PARTICIPANT',
			'A conversation must have at least one participant with exactly one valid identity.'
		);
	}
}

import { ApplicationError } from '../ApplicationError.js';

export class MessageNotFoundError extends ApplicationError<'MESSAGE_NOT_FOUND'> {
	constructor() {
		super('MESSAGE_NOT_FOUND', 'Message not found.');
	}
}

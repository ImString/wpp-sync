import { ApplicationError } from '../ApplicationError.js';

export class InvalidMessageError extends ApplicationError<'INVALID_MESSAGE'> {
	constructor() {
		super('INVALID_MESSAGE', 'The message content is invalid.');
	}
}

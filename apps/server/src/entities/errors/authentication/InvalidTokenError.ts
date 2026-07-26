import { ApplicationError } from '../ApplicationError.js';

export class InvalidTokenError extends ApplicationError<'INVALID_TOKEN'> {
	constructor(message: string = 'Invalid token.') {
		super('INVALID_TOKEN', message);
	}
}

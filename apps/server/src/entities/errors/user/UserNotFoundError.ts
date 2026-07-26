import { ApplicationError } from '../ApplicationError.js';

export class UserNotFoundError extends ApplicationError<'USER_NOT_FOUND'> {
	constructor() {
		super('USER_NOT_FOUND', 'User not found.');
	}
}

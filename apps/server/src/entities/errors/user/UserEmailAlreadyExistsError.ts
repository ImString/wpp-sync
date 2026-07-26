import { ApplicationError } from '../ApplicationError.js';

export class UserEmailAlreadyExistsError extends ApplicationError<'USER_EMAIL_ALREADY_EXISTS'> {
	constructor() {
		super('USER_EMAIL_ALREADY_EXISTS', 'User with same e-mail already exists.', {
			errors: { email: 'This e-mail is already registered.' }
		});
	}
}

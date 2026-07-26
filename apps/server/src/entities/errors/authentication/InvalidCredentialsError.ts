import { ApplicationError } from '../ApplicationError.js';

export class InvalidCredentialsError extends ApplicationError<'USER_OR_PASSWORD_INCORRECT'> {
	constructor() {
		super('USER_OR_PASSWORD_INCORRECT', 'User or password incorrect.');
	}
}

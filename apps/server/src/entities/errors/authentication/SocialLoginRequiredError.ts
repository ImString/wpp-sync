import { ApplicationError } from '../ApplicationError.js';

export class SocialLoginRequiredError extends ApplicationError<'USER_NO_PASSWORD_USE_SOCIAL_LOGIN'> {
	constructor() {
		super('USER_NO_PASSWORD_USE_SOCIAL_LOGIN', 'User does not have a password, use social login.');
	}
}

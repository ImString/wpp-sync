import { ApplicationError } from '../ApplicationError.js';

export class GoogleAuthCredentialsRequiredError extends ApplicationError<'GOOGLE_AUTH_CREDENTIALS_REQUIRED'> {
	constructor() {
		super('GOOGLE_AUTH_CREDENTIALS_REQUIRED', 'Code or token must be provided.');
	}
}

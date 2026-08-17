import { ApplicationError } from '../ApplicationError.js';

export class GoogleEmailNotVerifiedError extends ApplicationError<'EMAIL_NOT_VERIFIED'> {
	constructor() {
		super('EMAIL_NOT_VERIFIED', 'Email is not verified.');
	}
}

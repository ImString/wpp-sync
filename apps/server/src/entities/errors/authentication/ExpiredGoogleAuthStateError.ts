import { ApplicationError } from '../ApplicationError.js';

export class ExpiredGoogleAuthStateError extends ApplicationError<'EXPIRED_GOOGLE_AUTH_STATE'> {
	constructor() {
		super('EXPIRED_GOOGLE_AUTH_STATE', 'Invalid or expired state.');
	}
}

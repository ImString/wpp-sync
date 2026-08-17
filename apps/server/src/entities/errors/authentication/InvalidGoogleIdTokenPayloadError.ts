import { ApplicationError } from '../ApplicationError.js';

export class InvalidGoogleIdTokenPayloadError extends ApplicationError<'INVALID_GOOGLE_ID_TOKEN_PAYLOAD'> {
	constructor() {
		super('INVALID_GOOGLE_ID_TOKEN_PAYLOAD', 'Invalid ID token payload.');
	}
}

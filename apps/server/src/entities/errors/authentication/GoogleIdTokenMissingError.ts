import { ApplicationError } from '../ApplicationError.js';

export class GoogleIdTokenMissingError extends ApplicationError<'GOOGLE_ID_TOKEN_MISSING'> {
	constructor() {
		super('GOOGLE_ID_TOKEN_MISSING', 'ID token is missing in credentials.');
	}
}

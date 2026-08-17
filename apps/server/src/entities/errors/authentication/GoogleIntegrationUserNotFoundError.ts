import { ApplicationError } from '../ApplicationError.js';

export class GoogleIntegrationUserNotFoundError extends ApplicationError<'INTEGRATION_USER_NOT_FOUND'> {
	constructor() {
		super('INTEGRATION_USER_NOT_FOUND', 'User linked to this GOOGLE account was not found.');
	}
}

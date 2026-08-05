import { ApplicationError } from '../ApplicationError.js';

export class IntegrationNotFoundError extends ApplicationError<'INTEGRATION_NOT_FOUND'> {
	constructor() {
		super('INTEGRATION_NOT_FOUND', 'Integration not found.');
	}
}

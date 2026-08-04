import { ApplicationError } from '../ApplicationError.js';

export class ContactNotFoundError extends ApplicationError<'CONTACT_NOT_FOUND'> {
	constructor() {
		super('CONTACT_NOT_FOUND', 'Contact not found.');
	}
}

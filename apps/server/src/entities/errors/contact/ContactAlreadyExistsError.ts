import { ApplicationError } from '../ApplicationError.js';

export class ContactAlreadyExistsError extends ApplicationError<'CONTACT_ALREADY_EXISTS'> {
	constructor() {
		super('CONTACT_ALREADY_EXISTS', 'A contact with this WhatsApp number already exists.');
	}
}

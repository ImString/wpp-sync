import { ApplicationError } from '../ApplicationError.js';

export class ContactStageNotFoundError extends ApplicationError<'CONTACT_STAGE_NOT_FOUND'> {
	constructor() {
		super('CONTACT_STAGE_NOT_FOUND', 'Contact stage not found.');
	}
}

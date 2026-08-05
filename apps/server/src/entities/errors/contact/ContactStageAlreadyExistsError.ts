import { ApplicationError } from '../ApplicationError.js';

export class ContactStageAlreadyExistsError extends ApplicationError<'CONTACT_STAGE_ALREADY_EXISTS'> {
	constructor() {
		super('CONTACT_STAGE_ALREADY_EXISTS', 'Já existe uma etapa com esse nome.');
	}
}

import { ApplicationError } from '../ApplicationError.js';

export class InvalidImageError extends ApplicationError<'INVALID_IMAGE'> {
	constructor() {
		super('INVALID_IMAGE', 'The selected image could not be processed.');
	}
}

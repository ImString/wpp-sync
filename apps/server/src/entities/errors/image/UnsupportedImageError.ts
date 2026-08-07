import { ApplicationError } from '../ApplicationError.js';

export class UnsupportedImageError extends ApplicationError<'UNSUPPORTED_FILE_TYPE'> {
	constructor() {
		super('UNSUPPORTED_FILE_TYPE', 'The image type is not supported.');
	}
}

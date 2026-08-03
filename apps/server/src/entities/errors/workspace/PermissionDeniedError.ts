import { ApplicationError } from '../ApplicationError.js';

export class PermissionDeniedError extends ApplicationError<'PERMISSION_DENIED'> {
	constructor() {
		super('PERMISSION_DENIED', 'You do not have permission to perform this action.');
	}
}

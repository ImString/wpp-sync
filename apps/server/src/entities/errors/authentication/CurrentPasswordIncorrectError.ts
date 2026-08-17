import { ApplicationError } from '../ApplicationError.js';

export class CurrentPasswordIncorrectError extends ApplicationError<'CURRENT_PASSWORD_INCORRECT'> {
	constructor() {
		super('CURRENT_PASSWORD_INCORRECT', 'Current password is incorrect.', {
			errors: { currentPassword: 'Current password is incorrect.' }
		});
	}
}

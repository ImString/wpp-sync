import { ApplicationError } from '../../ApplicationError.js';

export class InviteWithSameEmailError extends ApplicationError<'INVITE_SAME_EMAIL'> {
	constructor() {
		super('INVITE_SAME_EMAIL', 'Another invite with same e-mail already exists.');
	}
}

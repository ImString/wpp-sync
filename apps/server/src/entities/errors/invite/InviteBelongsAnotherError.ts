import { ApplicationError } from '../ApplicationError.js';

export class InviteBelongsAnotherError extends ApplicationError<'INVITE_BELONGS_ANOTHER'> {
	constructor() {
		super('INVITE_BELONGS_ANOTHER', 'User not found.');
	}
}

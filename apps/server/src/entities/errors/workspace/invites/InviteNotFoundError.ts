import { ApplicationError } from '../../ApplicationError.js';

export class InviteNotFoundError extends ApplicationError<'INVITE_NOT_FOUND'> {
	constructor() {
		super('INVITE_NOT_FOUND', 'Workspace not found.');
	}
}

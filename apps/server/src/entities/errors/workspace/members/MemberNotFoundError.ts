import { ApplicationError } from '../../ApplicationError.js';

export class MemberNotFoundError extends ApplicationError<'MEMBER_NOT_FOUND'> {
	constructor() {
		super('MEMBER_NOT_FOUND', 'Member not found.');
	}
}

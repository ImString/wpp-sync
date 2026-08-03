import { ApplicationError } from '../../ApplicationError.js';

export class MemberAlreadyOwnerError extends ApplicationError {
	constructor() {
		super('MEMBER_ALREADY_OWNER', 'Member is already workspace owner.');
	}
}

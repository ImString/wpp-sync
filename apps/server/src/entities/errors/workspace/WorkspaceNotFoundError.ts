import { ApplicationError } from '../ApplicationError.js';

export class WorkspaceNotFoundError extends ApplicationError<'WORKSPACE_NOT_FOUND'> {
	constructor() {
		super('WORKSPACE_NOT_FOUND', 'Workspace not found.');
	}
}

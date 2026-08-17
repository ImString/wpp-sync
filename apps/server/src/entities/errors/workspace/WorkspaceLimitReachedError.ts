import { ApplicationError } from '../ApplicationError.js';

export class WorkspaceLimitReachedError extends ApplicationError<'WORKSPACE_LIMIT_REACHED'> {
	constructor() {
		super('WORKSPACE_LIMIT_REACHED', 'Esta conta atingiu o limite de duas áreas de trabalho.');
	}
}

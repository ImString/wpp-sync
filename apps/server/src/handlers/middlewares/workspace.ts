import { Middleware, RouterMiddleware, type RouterMiddlewareContext } from '@/modules/index.js';

import { WorkspaceService } from '@/services/WorkspaceService.js';

import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

@Middleware()
export class WorkspaceAccessMiddleware extends RouterMiddleware {
	constructor(private readonly workspaceService: WorkspaceService) {
		super();
	}

	async execute(context: RouterMiddlewareContext) {
		const uid = context.params?.uid;

		if (typeof uid !== 'string' || !uid) throw new WorkspaceNotFoundError();

		context.state.workspaceAccess = await this.workspaceService.getUserMembership(context.state.userId, uid);
	}
}

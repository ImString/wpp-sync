import { Controller, Get, HttpResponse, type RouterMiddlewareContext } from '@/modules/index.js';

import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/membership',
	middlewares: [AuthenticationMiddleware, WorkspaceAccessMiddleware]
})
export class WorkspaceMembershipController {
	@Get('/')
	async get(context: RouterMiddlewareContext) {
		const workspace = context.state.workspaceAccess?.workspace;
		const membership = context.state.workspaceAccess?.membership;
		if (!workspace || !membership) throw new WorkspaceNotFoundError();

		return HttpResponse.success(
			await membership.toObject({
				sign_files: true,
				workspaceOwnerId: workspace.data.ownerId
			})
		);
	}
}

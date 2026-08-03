import { Controller, Get, HttpResponse, type RouteSchemaContext } from '@/modules/index.js';

import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/membership',
	middlewares: [AuthenticationMiddleware, WorkspaceAccessMiddleware]
})
export class WorkspaceMembershipController {
	@Get('/')
	async get(context: RouteSchemaContext) {
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

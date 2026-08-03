import { hasPermission, type PermissionsFlags, type Roles } from '@wppsync/shared';

import { Middleware, RouterMiddleware, type RouterMiddlewareContext } from '@/modules/index.js';

import { PermissionDeniedError, WorkspaceNotFoundError } from '@/entities/errors/workspace/index.js';

export interface PermissionMiddlewareOptions {
	permissions: PermissionsFlags | readonly PermissionsFlags[];
}

@Middleware()
export class PermissionMiddleware extends RouterMiddleware {
	static options: PermissionMiddlewareOptions;

	async execute(context: RouterMiddlewareContext, options: PermissionMiddlewareOptions) {
		const workspaceAccess = context.state.workspaceAccess;
		if (!workspaceAccess) throw new WorkspaceNotFoundError();

		const role: Roles =
			workspaceAccess.workspace.data.ownerId === context.state.userId
				? 'OWNER'
				: workspaceAccess.membership.data.role === 'ADMIN'
					? 'ADMIN'
					: 'USER';

		const requiredPermissions = Array.isArray(options.permissions)
			? options.permissions
			: [options.permissions];

		if (!requiredPermissions.every(permission => hasPermission(role, permission))) {
			throw new PermissionDeniedError();
		}
	}
}

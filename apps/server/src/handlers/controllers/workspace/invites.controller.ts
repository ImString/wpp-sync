import { PermissionsFlags } from '@wppsync/shared';

import {
	Controller,
	Delete,
	Get,
	HttpResponse,
	Post,
	UseMiddleware,
	type RouterMiddlewareContext
} from '@/modules/index.js';

import { UserService } from '@/services/UserService.js';
import { InviteService } from '@/services/workspace/index.js';

import { WorkspaceInviteDTO } from '@/entities/dtos/workspace/invite.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { PermissionMiddleware } from '@/handlers/middlewares/permission.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/invites',
	middlewares: [AuthenticationMiddleware]
})
export class WorkspaceInvitesController {
	constructor(
		private readonly userService: UserService,
		private readonly invitesService: InviteService
	) {}

	@Get('/', WorkspaceInviteDTO.List)
	async list(context: RouterMiddlewareContext) {
		const user = await this.userService.get({ id: context.state.userId });

		const invites = await this.invitesService.list({
			email: user.data.email,
			...(context.query.name && {
				workspaceName: context.query.name
			}),
			include: {
				workspace: {
					include: {
						avatar: true
					}
				}
			}
		});

		return HttpResponse.success(invites);
	}

	@Post('/create', WorkspaceInviteDTO.Create)
	@UseMiddleware(
		WorkspaceAccessMiddleware,
		PermissionMiddleware.configure({ permissions: PermissionsFlags.INVITE_MANAGE })
	)
	async create(context: RouterMiddlewareContext) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const invite = await this.invitesService.create({
			email: context.body.email,
			role: context.body.role,
			workspaceId: workspace.id
		});

		return HttpResponse.success(invite);
	}

	@Delete('/:inviteId/revoke')
	@UseMiddleware(
		WorkspaceAccessMiddleware,
		PermissionMiddleware.configure({ permissions: PermissionsFlags.INVITE_MANAGE })
	)
	async revoke(context: RouterMiddlewareContext) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const { inviteId } = context.params;

		await this.invitesService.revoke({
			inviteId,
			workspaceId: workspace.id
		});

		return HttpResponse.success();
	}
}

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

import { InviteService } from '@/services/workspace/index.js';

import { WorkspaceInviteDTO } from '@/entities/dtos/workspace/invite.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { PermissionMiddleware } from '@/handlers/middlewares/permission.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/invites',
	middlewares: [AuthenticationMiddleware, WorkspaceAccessMiddleware]
})
export class WorkspaceInvitesController {
	constructor(private readonly invitesService: InviteService) {}

	@Get('/', WorkspaceInviteDTO.List)
	@UseMiddleware(PermissionMiddleware.configure({ permissions: PermissionsFlags.INVITE_MANAGE }))
	async list(context: RouterMiddlewareContext) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const invites = await this.invitesService.list({
			workspaceId: workspace.id,
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
	@UseMiddleware(PermissionMiddleware.configure({ permissions: PermissionsFlags.INVITE_MANAGE }))
	async create(context: RouterMiddlewareContext) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const invite = await this.invitesService.create({
			email: context.body.email,
			role: context.body.role,
			workspaceId: workspace.id,
			authorId: context.state.userId
		});

		return HttpResponse.success(await invite.toObject({ sign_files: true }));
	}

	@Delete('/:inviteId/revoke', WorkspaceInviteDTO.Revoke)
	@UseMiddleware(PermissionMiddleware.configure({ permissions: PermissionsFlags.INVITE_MANAGE }))
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

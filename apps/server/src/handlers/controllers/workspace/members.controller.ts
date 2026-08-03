import { PermissionsFlags } from '@wppsync/shared';

import {
	Controller,
	Delete,
	Get,
	HttpResponse,
	Patch,
	UseMiddleware,
	type RouterMiddlewareContext
} from '@/modules/index.js';

import { MemberService } from '@/services/workspace/MemberService.js';

import { WorkspaceMemberDTO } from '@/entities/dtos/workspace/member.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';
import { PermissionDeniedError } from '@/entities/errors/workspace/index.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { PermissionMiddleware } from '@/handlers/middlewares/permission.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/members',
	middlewares: [AuthenticationMiddleware, WorkspaceAccessMiddleware]
})
export class WorkspaceMembersController {
	constructor(private readonly membersService: MemberService) {}

	private includes = () => {
		return {
			user: {
				include: {
					avatar: true
				}
			}
		};
	};

	@Get('', WorkspaceMemberDTO.List)
	async list(context: RouterMiddlewareContext) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const members = await this.membersService.list({
			searchName: context.query.name,
			workspaceId: workspace.data.id,
			workspaceOwnerId: workspace.data.ownerId,
			include: this.includes()
		});

		return HttpResponse.success(members);
	}

	@Get('/:memberId', WorkspaceMemberDTO.Get)
	async get(context: RouterMiddlewareContext) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const member = await this.membersService.get({
			id: context.params.memberId,
			workspaceId: workspace.data.id,
			include: this.includes()
		});

		return HttpResponse.success(
			await member.toObject({
				sign_files: true,
				workspaceOwnerId: workspace.data.ownerId
			})
		);
	}

	@Patch('/:memberId/update', WorkspaceMemberDTO.Update)
	@UseMiddleware(PermissionMiddleware.configure({ permissions: PermissionsFlags.MEMBER_MANAGE }))
	async update(context: RouterMiddlewareContext) {
		const { memberId } = context.params;

		const workspace = context.state.workspaceAccess?.workspace;
		const currentMembership = context.state.workspaceAccess?.membership;
		if (!workspace || !currentMembership) throw new WorkspaceNotFoundError();

		const member = await this.membersService.get({
			id: memberId,
			workspaceId: workspace.data.id
		});
		if (member.data.userId === workspace.data.ownerId) throw new PermissionDeniedError();

		const { role } = context.body;

		await this.membersService.update({
			id: memberId,
			workspaceId: workspace.data.id!,
			role
		});

		return HttpResponse.success();
	}

	@Delete('/:memberId/remove', WorkspaceMemberDTO.Remove)
	@UseMiddleware(PermissionMiddleware.configure({ permissions: PermissionsFlags.MEMBER_KICK }))
	async remove(context: RouterMiddlewareContext) {
		const { memberId } = context.params;

		const workspace = context.state.workspaceAccess?.workspace;
		const currentMembership = context.state.workspaceAccess?.membership;
		if (!workspace || !currentMembership) throw new WorkspaceNotFoundError();

		const member = await this.membersService.get({
			id: memberId,
			workspaceId: workspace.data.id
		});
		if (member.data.userId === workspace.data.ownerId) throw new PermissionDeniedError();

		const currentRole = currentMembership.resolveRole(workspace.data.ownerId);
		if (currentRole !== 'OWNER' && member.data.role === 'ADMIN') {
			throw new PermissionDeniedError();
		}

		await this.membersService.remove({
			id: memberId,
			workspaceId: workspace.data.id!
		});

		return HttpResponse.success();
	}
}

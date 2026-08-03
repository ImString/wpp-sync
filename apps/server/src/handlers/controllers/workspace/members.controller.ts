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

import { WorksapceMemberDTO } from '@/entities/dtos/workspace/member.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

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

	@Get('', WorksapceMemberDTO.List)
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

	@Get('/:memberId', WorksapceMemberDTO.Get)
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

	@Patch('/:memberId/update')
	@UseMiddleware(PermissionMiddleware.configure({ permissions: PermissionsFlags.MEMBER_MANAGE }))
	async update() {}

	@Delete('/:memberId/remove')
	@UseMiddleware(PermissionMiddleware.configure({ permissions: PermissionsFlags.MEMBER_MANAGE }))
	async remove() {}
}

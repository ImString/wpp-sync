import { Controller, Delete, Get, HttpResponse, Patch, type RouterMiddlewareContext } from '@/modules/index.js';

import { MemberService } from '@/services/workspace/MemberService.js';

import { WorksapceMemberDTO } from '@/entities/dtos/workspace/member.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';
import { MemberNotFoundError } from '@/entities/errors/workspace/index.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
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

	@Get('')
	async list(context: RouterMiddlewareContext) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const members = await this.membersService.list({
			workspaceId: workspace.data.id,
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

		return HttpResponse.success(await member.toObject({ sign_files: true }));
	}

	@Patch('/:memberId/update')
	async update() {}

	@Delete('/:memberId/remove')
	async remove() {}
}

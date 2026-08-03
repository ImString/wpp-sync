import { Controller, Delete, Get, HttpResponse, Post, type RouteSchemaContext } from '@/modules/index.js';

import { UserService } from '@/services/UserService.js';
import { InviteService } from '@/services/workspace/InviteService.js';

import { InvitesDTO } from '@/entities/dtos/invites.dto.js';

import { AuthenticationMiddleware } from '../middlewares/authentication.js';

@Controller({
	path: '/invites',
	middlewares: [AuthenticationMiddleware]
})
export class InvitesController {
	constructor(
		private readonly userService: UserService,
		private readonly inviteService: InviteService
	) {}

	@Get('/pending')
	async pendingList(context: RouteSchemaContext) {
		const userId = context.state.userId;

		const user = await this.userService.get({ id: userId });

		const invites = await this.inviteService.list({
			email: user.data.email,
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

	@Post('/:inviteId/accept', InvitesDTO.Accept)
	async acceptInvite(context: RouteSchemaContext) {
		const { inviteId } = context.params;

		await this.inviteService.accept({ inviteId, userId: context.state.userId });

		return HttpResponse.success();
	}

	@Delete('/:inviteId/reject', InvitesDTO.Reject)
	async rejectInvite(context: RouteSchemaContext) {
		const { inviteId } = context.params;

		await this.inviteService.reject({ inviteId, userId: context.state.userId });

		return HttpResponse.success();
	}
}

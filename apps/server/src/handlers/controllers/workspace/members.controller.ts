import { Controller, Delete, Get, Patch } from '@/modules/index.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/members',
	middlewares: [AuthenticationMiddleware, WorkspaceAccessMiddleware]
})
export class WorkspaceMembersController {
	@Get('')
	async list() {}

	@Get('/:memberId')
	async get() {}

	@Patch('/:memberId/update')
	async update() {}

	@Delete('/:memberId/remove')
	async remove() {}
}

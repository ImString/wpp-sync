import { Inject } from '@/core/index.js';

import { Controller, Get, HttpResponse, Post } from '@/modules/index.js';

import { WorkspaceService } from '@/services/WorkspaceService.js';

import { WorkspaceDTO } from '@/entities/dtos/workspace.dto.js';

import { AuthenticationMiddleware } from '../middlewares/authentication.js';

@Controller({
	path: '/workspace',
	middlewares: [AuthenticationMiddleware]
})
export class WorkspaceController {
	constructor(@Inject(WorkspaceService) private readonly workspaceService: WorkspaceService) {}

	@Post('/create', WorkspaceDTO.Create)
	async create(context: typeof WorkspaceDTO.Create.context) {
		const form = await WorkspaceDTO.Create.toForm({ request: context.request });
		const avatar = form.files.find(file => file.fieldname === 'avatar');
		const workspace = await this.workspaceService.create(context.state.userId, form.fields, avatar);

		return HttpResponse.success(workspace);
	}

	@Get('/list', WorkspaceDTO.List)
	async list(context: typeof WorkspaceDTO.List.context) {
		const workspaces = await this.workspaceService.list({
			userId: context.state.userId
		});

		return HttpResponse.success(workspaces);
	}
}

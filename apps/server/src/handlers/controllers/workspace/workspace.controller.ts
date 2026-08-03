import { Controller, Get, HttpResponse, Post, type RouteSchemaContext, UseMiddleware } from '@/modules/index.js';

import { WorkspaceService } from '@/services/index.js';

import { WorkspaceDTO } from '@/entities/dtos/workspace/workspace.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

import { AuthenticationMiddleware } from '../../middlewares/authentication.js';

@Controller({
	path: '/workspace',
	middlewares: [AuthenticationMiddleware]
})
export class WorkspaceController {
	constructor(private readonly workspaceService: WorkspaceService) {}

	@Get('/:uid')
	@UseMiddleware(WorkspaceAccessMiddleware)
	async get(context: RouteSchemaContext) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		return HttpResponse.success(await workspace.toObject({ sign_files: true }));
	}

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

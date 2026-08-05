import { Controller, Delete, Get, HttpResponse, Post, Put } from '@/modules/index.js';

import { IntegrationService } from '@/services/index.js';

import { IntegrationDTO } from '@/entities/dtos/integrations/integration.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/integrations',
	middlewares: [AuthenticationMiddleware, WorkspaceAccessMiddleware]
})
export class IntegrationsController {
	constructor(private readonly integrationService: IntegrationService) {}

	@Get('/', IntegrationDTO.List)
	async list(context: typeof IntegrationDTO.List.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const integrations = await this.integrationService.list({
			...(context.query.search && { search: context.query.search }),
			...(context.query.page && { page: context.query.page }),
			...(context.query.limit && { limit: context.query.limit }),
			...(context.query.status && { status: context.query.status }),
			workspace: workspace.id
		});

		return HttpResponse.success(integrations);
	}

	@Get('/all-count', IntegrationDTO.AllCount)
	async allCount(context: typeof IntegrationDTO.AllCount.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const count = await this.integrationService.allCount({
			workspace: workspace.id
		});

		return HttpResponse.success(count);
	}

	@Get('/:dataId', IntegrationDTO.Get)
	async get(context: typeof IntegrationDTO.Get.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const integration = await this.integrationService.get({
			id: context.params.dataId,
			workspace: workspace.id
		});

		return HttpResponse.success(await integration.toObject({}));
	}

	@Post('/create', IntegrationDTO.Create)
	async create(context: typeof IntegrationDTO.Create.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const integration = await this.integrationService.create({
			name: context.body.name,
			type: context.body.type,
			workspace: workspace.id
		});

		return HttpResponse.success(await integration.toObject({}));
	}

	@Put('/:dataId/update', IntegrationDTO.Update)
	async update(context: typeof IntegrationDTO.Update.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const integration = await this.integrationService.get({
			id: context.params.dataId,
			workspace: workspace.id
		});

		await this.integrationService.update(integration, {
			name: context.body.name
		});

		return HttpResponse.success();
	}

	@Delete('/:dataId/delete', IntegrationDTO.Delete)
	async delete(context: typeof IntegrationDTO.Delete.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const integration = await this.integrationService.get({
			id: context.params.dataId,
			workspace: workspace.id
		});

		await this.integrationService.update(integration, {
			isDeleted: true
		});

		return HttpResponse.success();
	}
}

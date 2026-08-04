import { Controller, Get, HttpResponse, Post, Put, type RouteSchemaContext } from '@/modules/index.js';

import { ContactStageService } from '@/services/index.js';

import { ContactStagesDTO } from '@/entities/dtos/contacts/contact-stages.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/contact-stages',
	middlewares: [AuthenticationMiddleware, WorkspaceAccessMiddleware]
})
export class ContactStagesController {
	constructor(private readonly contactStageService: ContactStageService) {}

	@Get('/')
	async list(context: RouteSchemaContext) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const contactStages = await this.contactStageService.list({
			workspace: workspace.id
		});

		return HttpResponse.success(contactStages);
	}

	@Get('/:dataId', ContactStagesDTO.Get)
	async get(context: typeof ContactStagesDTO.Get.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const contactStage = await this.contactStageService.get({
			id: context.params.dataId,
			workspace: workspace.id
		});

		return HttpResponse.success(contactStage.toObject({}));
	}

	@Post('/create', ContactStagesDTO.Create)
	async create(context: typeof ContactStagesDTO.Create.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		const membership = context.state.workspaceAccess?.membership;
		if (!workspace || !membership) throw new WorkspaceNotFoundError();

		const contact = await this.contactStageService.create({
			name: context.body.name,
			color: context.body.color,
			icon: context.body.icon,
			...(context.body.description && { description: context.body.description }),
			workspace: workspace.id
		});

		return HttpResponse.success(await contact.toObject({ sign_files: true }));
	}

	@Put('/:dataId/update', ContactStagesDTO.Update)
	async update(context: typeof ContactStagesDTO.Update.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const contactStage = await this.contactStageService.get({
			id: context.params.dataId,
			workspace: workspace.id
		});

		await this.contactStageService.update(contactStage, {
			name: context.body.name,
			color: context.body.color,
			icon: context.body.icon,
			description: context.body.description
		});

		return HttpResponse.success();
	}
}

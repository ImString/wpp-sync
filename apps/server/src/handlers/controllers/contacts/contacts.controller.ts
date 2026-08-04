import { Prisma } from '@wppsync/database';

import { Controller, Delete, Get, HttpResponse, Post, Put } from '@/modules/index.js';

import { ContactService } from '@/services/index.js';

import { ContactsDTO } from '@/entities/dtos/contacts/contacts.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/contacts',
	middlewares: [AuthenticationMiddleware, WorkspaceAccessMiddleware]
})
export class ContactsController {
	constructor(private readonly contactService: ContactService) {}

	private includes = (): Prisma.ContactInclude => {
		return {
			stage: true
		};
	};

	@Get('/', ContactsDTO.List)
	async list(context: typeof ContactsDTO.List.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const contacts = await this.contactService.list({
			...(context.query.name && { name: context.query.name }),
			...(context.query.page && { page: context.query.page }),
			...(context.query.limit && { limit: context.query.limit }),
			include: this.includes(),
			workspace: workspace.id
		});

		return HttpResponse.success(contacts);
	}

	@Get('/:dataId', ContactsDTO.Get)
	async get(context: typeof ContactsDTO.Get.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const contact = await this.contactService.get({
			id: context.params.dataId,
			include: this.includes(),
			workspace: workspace.id
		});

		return HttpResponse.success(await contact.toObject({ sign_files: true }));
	}

	@Post('/create', ContactsDTO.Create)
	async create(context: typeof ContactsDTO.Create.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		const membership = context.state.workspaceAccess?.membership;
		if (!workspace || !membership) throw new WorkspaceNotFoundError();

		const contact = await this.contactService.create({
			name: context.body.name,
			email: context.body.email,
			whatsapp: context.body.whatsapp,
			notes: context.body.notes,
			tags: context.body.tags,
			author: membership.data.id,
			workspace: workspace.id
		});

		return HttpResponse.success(await contact.toObject({ sign_files: true }));
	}

	@Put('/:dataId/update', ContactsDTO.Update)
	async update(context: typeof ContactsDTO.Update.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const contact = await this.contactService.get({
			id: context.params.dataId,
			workspace: workspace.id
		});

		await this.contactService.update(contact, {
			name: context.body.name,
			email: context.body.email,
			notes: context.body.notes,
			tags: context.body.tags,
			whatsapp: context.body.whatsapp
		});

		return HttpResponse.success();
	}

	@Delete('/:dataId/delete', ContactsDTO.Delete)
	async delete(context: typeof ContactsDTO.Delete.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const contact = await this.contactService.get({
			id: context.params.dataId,
			workspace: workspace.id
		});

		await this.contactService.update(contact, {
			isDeleted: true
		});

		return HttpResponse.success();
	}
}

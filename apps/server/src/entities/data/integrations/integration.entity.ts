import { Integration, type IntegrationWebConfig, Prisma, Workspace } from '@wppsync/database';

import { FilesService } from '@/services/FilesService.js';

import { Entity } from '../Entity.js';
import { EntityGroup } from '../Group.js';
import { WorkspaceEntity } from '../workspaces/workspace.entity.js';

export type IntegrationEntityRaw = Partial<Integration>;
export type IntegrationEntityExtra = {
	workspace?: Workspace | null;
};
export type IntegrationEntityEntities = {
	workspace?: WorkspaceEntity | null;
};

export type IntegrationEntityPopulated = IntegrationEntityRaw & IntegrationEntityExtra;

export class IntegrationEntity extends Entity<IntegrationEntityRaw, IntegrationEntityExtra, IntegrationEntityEntities> {
	constructor(data: IntegrationEntityPopulated = {}, entities: IntegrationEntityEntities = {}) {
		const normalData = { ...data, workspace: undefined };
		const extra = { workspace: data.workspace };

		const dataEntities: IntegrationEntityEntities = { ...entities };

		if (data.workspace) {
			dataEntities.workspace = new WorkspaceEntity(data.workspace);
		}

		super({ data: normalData, extra, entities: dataEntities });
	}

	get config() {
		return this.data.config;
	}

	private async toPublicConfig() {
		if (!this.config || this.data.type !== 'WEB') return this.config;

		const { headerPhotoId, ...config } = this.config as IntegrationWebConfig;
		const headerPhoto = headerPhotoId ? await FilesService.generateSignedFileURLById(headerPhotoId) : undefined;

		return {
			...config,
			...(headerPhoto && { headerPhoto })
		};
	}

	async toObject(options: {}) {
		return {
			id: this.id,

			name: this.data.name,
			type: this.data.type,
			status: this.data.status,
			config: await this.toPublicConfig()
		};
	}

	async create() {
		await this.db.integration.create({
			data: this.toRaw() as Prisma.IntegrationUncheckedCreateInput
		});
	}

	async update() {
		await this.db.integration.update({
			where: {
				id: this.id
			},
			data: this.changes as Prisma.IntegrationUncheckedUpdateInput
		});
	}

	async delete() {
		await this.db.integration.delete({
			where: {
				id: this.id
			}
		});

		await super.delete();
	}

	static fromList(dataList: IntegrationEntityPopulated[]) {
		return new EntityGroup(dataList.map(data => new IntegrationEntity(data)));
	}
}

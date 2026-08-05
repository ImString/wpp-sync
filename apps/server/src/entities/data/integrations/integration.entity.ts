import { Integration, Prisma } from '@wppsync/database';

import { Entity } from '../Entity.js';
import { EntityGroup } from '../Group.js';

export type IntegrationEntityRaw = Partial<Integration>;
export type IntegrationEntityExtra = {};
export type IntegrationEntityEntities = {};

export type IntegrationEntityPopulated = IntegrationEntityRaw & IntegrationEntityExtra;

export class IntegrationEntity extends Entity<IntegrationEntityRaw, IntegrationEntityExtra, IntegrationEntityEntities> {
	constructor(data: IntegrationEntityPopulated = {}, entities: IntegrationEntityEntities = {}) {
		const normalData = { ...data };
		const extra = {};

		const dataEntities: IntegrationEntityEntities = { ...entities };

		super({ data: normalData, extra, entities: dataEntities });
	}

	async toObject(options: {}) {
		return {
			id: this.id,

			name: this.data.name,
			type: this.data.type,
			status: this.data.status
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

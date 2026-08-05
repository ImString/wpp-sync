import { ContactStage } from '@wppsync/database';
import { Slug } from '@wppsync/shared';

import { Entity } from '../Entity.js';
import { EntityGroup } from '../Group.js';

export type ContactStageEntityRaw = Partial<ContactStage> & {
	_count?: {
		contacts: number;
	};
};
export type ContactStageEntityExtra = {};
export type ContactStageEntityEntities = {};

export type ContactStageEntityPopulated = ContactStageEntityRaw & ContactStageEntityExtra;

export class ContactStageEntity extends Entity<
	ContactStageEntityRaw,
	ContactStageEntityExtra,
	ContactStageEntityEntities
> {
	constructor(data: ContactStageEntityPopulated = {}, entities: ContactStageEntityEntities = {}) {
		const normalData = { ...data };
		const extra = {};

		const dataEntities: ContactStageEntityEntities = { ...entities };

		super({ data: normalData, extra, entities: dataEntities });
	}

	async toObject(options: {}) {
		return {
			id: this.id,

			name: this.data.name,
			slug: this.data.slug || Slug.createSlug(this.data.name || ''),
			position: this.data.position,
			color: this.data.color,
			icon: this.data.icon,
			contactCount: this.data._count?.contacts || 0,
			...(this.data.description && { description: this.data.description }),

			createdAt: this.data.createdAt
		};
	}

	static fromList(dataList: ContactStageEntityRaw[]) {
		return new EntityGroup(dataList.map(data => new ContactStageEntity(data)));
	}
}

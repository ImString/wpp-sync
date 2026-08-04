import { Contact, ContactStage } from '@wppsync/database';

import { Entity } from '../Entity.js';
import { EntityGroup } from '../Group.js';
import { ContactStageEntity } from './contact-stage.entity.js';

export type ContactEntityRaw = Partial<Contact>;
export type ContactEntityExtra = {
	stage?: ContactStage | null;
};
export type ContactEntityEntities = {
	stage?: ContactStageEntity | null;
};

export type ContactEntityPopulated = ContactEntityRaw & ContactEntityExtra;

export class ContactEntity extends Entity<ContactEntityRaw, ContactEntityExtra, ContactEntityEntities> {
	constructor(data: ContactEntityPopulated = {}, entities: ContactEntityEntities = {}) {
		const normalData = { ...data, stage: undefined };
		const extra = { stage: data.stage };

		const dataEntities: ContactEntityEntities = { ...entities };

		if (data.stage) {
			dataEntities.stage = new ContactStageEntity(data.stage);
		}

		super({ data: normalData, extra, entities: dataEntities });
	}

	async toObject(options: { sign_files?: boolean }) {
		return {
			id: this.id,

			name: this.data.name,
			...(this.data.pushName && {
				pushName: this.data.pushName
			}),
			email: this.data.email,
			...(this.data.tags && { tags: this.data.tags.split(',') }),
			...(this.data.notes && { notes: this.data.notes }),
			...(this.entities.stage && { stage: this.entities.stage.toObject({}) }),
			whatsapp: this.data.whatsapp,

			createdAt: this.data.createdAt
		};
	}

	async create() {
		await this.db.contact.create({
			data: this.toRaw() as Required<ContactEntityRaw>
		});
	}

	async update() {
		await this.db.contact.update({
			where: {
				id: this.id
			},
			data: this.changes
		});
	}

	static fromList(dataList: ContactEntityRaw[]) {
		return new EntityGroup(dataList.map(data => new ContactEntity(data)));
	}
}

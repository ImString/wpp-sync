import { type Invite, type Prisma, type User } from '@wppsync/database';

import { Entity } from '../Entity.js';
import { EntityGroup } from '../Group.js';
import { UserEntity, type UserEntityObject } from '../others/user.entity.js';

export type InviteEntityRaw = Partial<Invite>;
export type InviteEntityExtra = {
	author?: User | string | null;
};
export type InviteEntityEntities = {
	author?: UserEntity;
};

export type InviteEntityPopulated = InviteEntityRaw & InviteEntityExtra;

export interface InviteEntityObject {
	id: string;
	email?: string;
	role?: Invite['role'];
	author?: UserEntityObject;
	createdAt?: Date;
}

export interface InviteEntityObjectOptions {
	sign_files?: boolean;
	duration?: number;
}

export class InviteEntity extends Entity<InviteEntityRaw, InviteEntityExtra, InviteEntityEntities> {
	constructor(data: InviteEntityPopulated = {}, entities: InviteEntityEntities = {}) {
		const { author, ...normalData } = data;
		const dataEntities = { ...entities };

		if (author && !dataEntities.author && typeof author === 'object') {
			dataEntities.author = new UserEntity(author);
		}

		super({
			data: normalData,
			extra: { author },
			entities: dataEntities
		});
	}

	async toObject(options: InviteEntityObjectOptions = {}): Promise<InviteEntityObject> {
		return {
			id: this.id,
			email: this.data.email,
			role: this.data.role,
			author: await this.entities.author?.toObject(options),
			createdAt: this.data.createdAt
		};
	}

	async create() {
		const { id: _temporaryId, ...data } = this.toRaw();
		const createdInvite = await this.db.invite.create({
			data: data as Prisma.InviteUncheckedCreateInput
		});

		Object.assign(this.original, createdInvite);
		this.changes = {};
	}

	async update() {
		const updatedInvite = await this.db.invite.update({
			where: {
				id: this.id
			},
			data: this.changes as Prisma.InviteUncheckedUpdateInput
		});

		Object.assign(this.original, updatedInvite);
		this.changes = {};
	}

	async delete() {
		await this.db.invite.delete({
			where: {
				id: this.id
			}
		});

		await super.delete();
	}

	static fromList(dataList: InviteEntityPopulated[]) {
		return new EntityGroup(dataList.map(data => new InviteEntity(data)));
	}
}

import { type Member, type Prisma, type User } from '@wppsync/database';

import { Entity } from '../Entity.js';
import { EntityGroup } from '../Group.js';
import { UserEntity, type UserEntityObject } from '../others/user.entity.js';

export type MemberEntityRaw = Partial<Member>;
export type MemberEntityExtra = {
	user?: User | string;
};
export type MemberEntityEntities = {
	user?: UserEntity;
};

export type MemberEntityPopulated = MemberEntityRaw & MemberEntityExtra;

export interface MemberEntityObject {
	id: string;
	role?: Member['role'];
	disabled?: boolean;
	user?: UserEntityObject;
}

export interface MemberEntityObjectOptions {
	sign_files?: boolean;
	duration?: number;
}

export class MemberEntity extends Entity<MemberEntityRaw, MemberEntityExtra, MemberEntityEntities> {
	constructor(data: MemberEntityPopulated = {}, entities: MemberEntityEntities = {}) {
		const { user, ...normalData } = data;
		const dataEntities = { ...entities };

		if (user && !dataEntities.user && typeof user === 'object') {
			dataEntities.user = new UserEntity(user);
		}

		super({
			data: normalData,
			extra: { user },
			entities: dataEntities
		});
	}

	async toObject(options: MemberEntityObjectOptions = {}): Promise<MemberEntityObject> {
		return {
			id: this.id,
			role: this.data.role,
			disabled: this.data.disabled,
			user: await this.entities.user?.toObject(options)
		};
	}

	async create() {
		const { id: _temporaryId, ...data } = this.toRaw();
		const createdMember = await this.db.member.create({
			data: data as Prisma.MemberUncheckedCreateInput
		});

		Object.assign(this.original, createdMember);
		this.changes = {};
	}

	async update() {
		const updatedMember = await this.db.member.update({
			where: {
				id: this.id
			},
			data: this.changes as Prisma.MemberUncheckedUpdateInput
		});

		Object.assign(this.original, updatedMember);
		this.changes = {};
	}

	async delete() {
		await this.db.member.delete({
			where: {
				id: this.id
			}
		});

		await super.delete();
	}

	static fromList(dataList: MemberEntityPopulated[]) {
		return new EntityGroup(dataList.map(data => new MemberEntity(data)));
	}
}

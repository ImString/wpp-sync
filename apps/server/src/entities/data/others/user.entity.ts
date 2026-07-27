import { type Files, type Prisma, type User } from '@wppsync/database';

import { Entity } from '../Entity.js';
import { EntityGroup } from '../Group.js';
import { FileEntity, type FileEntityObject } from './file.entity.js';

export type UserEntityRaw = Partial<User>;
export type UserEntityExtra = {
	avatar?: Files | string | null;
};
export type UserEntityEntities = {
	avatar?: FileEntity;
};

export type UserEntityPopulated = UserEntityRaw & UserEntityExtra;

export interface UserEntityObject {
	id: string;
	name?: string;
	email?: string;
	phone?: string | null;
	enterprise?: string | null;
	avatarId?: string | null;
	avatar?: FileEntityObject;
	avatarUrl?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
}

export class UserEntity extends Entity<UserEntityRaw, UserEntityExtra, UserEntityEntities> {
	constructor(data: UserEntityPopulated = {}, entities: UserEntityEntities = {}) {
		const { avatar, ...normalData } = data;
		const dataEntities = { ...entities };

		if (avatar && !dataEntities.avatar && typeof avatar === 'object') {
			dataEntities.avatar = new FileEntity(avatar);
		}

		super({
			data: normalData,
			extra: { avatar },
			entities: dataEntities
		});
	}

	async toObject(options: { sign_files?: boolean; duration?: number } = {}): Promise<UserEntityObject> {
		const avatar = await this.entities.avatar?.toObject({
			sign_file: options.sign_files,
			duration: options.duration
		});

		return {
			id: this.id,
			name: this.data.name,
			email: this.data.email,
			...(this.data.phone && { phone: this.data.phone }),
			...(this.data.enterprise && { enterprise: this.data.enterprise }),
			avatarUrl: avatar?.url ?? undefined,
			createdAt: this.data.createdAt,
			updatedAt: this.data.updatedAt
		};
	}

	async create() {
		const { id: _temporaryId, ...data } = this.toRaw();
		const createdUser = await this.db.user.create({
			data: data as Prisma.UserUncheckedCreateInput
		});

		Object.assign(this.original, createdUser);
		this.changes = {};
	}

	async update() {
		const updatedUser = await this.db.user.update({
			where: {
				id: this.id
			},
			data: this.changes as Prisma.UserUncheckedUpdateInput
		});

		Object.assign(this.original, updatedUser);
		this.changes = {};
	}

	async delete() {
		await this.db.user.delete({
			where: {
				id: this.id
			}
		});

		await super.delete();
	}

	static fromList(dataList: UserEntityPopulated[]) {
		return new EntityGroup(dataList.map(data => new UserEntity(data)));
	}
}

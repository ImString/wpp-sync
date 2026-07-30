import { type Invite, type Prisma, type User, type Workspace } from '@wppsync/database';

import { Entity } from '../Entity.js';
import { EntityGroup } from '../Group.js';
import { UserEntity, type UserEntityObject } from '../others/user.entity.js';
import { WorkspaceEntity, type WorkspaceEntityObject } from './workspace.entity.js';

export type InviteEntityRaw = Partial<Invite>;
export type InviteEntityExtra = {
	author?: User | string | null;
	workspace?: Workspace | string;
};
export type InviteEntityEntities = {
	author?: UserEntity;
	workspace?: WorkspaceEntity;
};

export type InviteEntityPopulated = InviteEntityRaw & InviteEntityExtra;

export interface InviteEntityObject {
	id: string;
	email?: string;
	role?: Invite['role'];
	author?: UserEntityObject;
	workspace?: WorkspaceEntityObject;
	createdAt?: Date;
}

export interface InviteEntityObjectOptions {
	sign_files?: boolean;
	duration?: number;
}

export class InviteEntity extends Entity<InviteEntityRaw, InviteEntityExtra, InviteEntityEntities> {
	constructor(data: InviteEntityPopulated = {}, entities: InviteEntityEntities = {}) {
		const { author, workspace, ...normalData } = data;
		const dataEntities = { ...entities };

		if (author && !dataEntities.author && typeof author === 'object') {
			dataEntities.author = new UserEntity(author);
		}
		if (workspace && !dataEntities.workspace && typeof workspace === 'object') {
			dataEntities.workspace = new WorkspaceEntity(workspace);
		}

		super({
			data: normalData,
			extra: { author, workspace },
			entities: dataEntities
		});
	}

	async toObject(options: InviteEntityObjectOptions = {}): Promise<InviteEntityObject> {
		const [author, workspace] = await Promise.all([
			this.entities.author?.toObject(options),
			this.entities.workspace?.toObject(options)
		]);

		return {
			id: this.id,
			email: this.data.email,
			role: this.data.role,
			author,
			workspace,
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

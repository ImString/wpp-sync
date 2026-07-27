import { type Files, type Prisma, type User, type Workspace } from '@wppsync/database';

import { Entity } from '../Entity.js';
import { EntityGroup } from '../Group.js';
import { FileEntity } from '../others/file.entity.js';
import { UserEntity, type UserEntityObject } from '../others/user.entity.js';
import { InviteEntity, type InviteEntityObject, type InviteEntityPopulated } from './invites.entity.js';
import { MemberEntity, type MemberEntityObject, type MemberEntityPopulated } from './members.entity.js';

export type WorkspaceEntityRaw = Partial<Workspace>;
export type WorkspaceEntityExtra = {
	avatar?: Files | string | null;
	owner?: User | string;
	members?: MemberEntityPopulated[];
	invites?: InviteEntityPopulated[];
};
export type WorkspaceEntityEntities = {
	avatar?: FileEntity;
	owner?: UserEntity;
	members?: EntityGroup<MemberEntity>;
	invites?: EntityGroup<InviteEntity>;
};

export type WorkspaceEntityPopulated = WorkspaceEntityRaw & WorkspaceEntityExtra;

export interface WorkspaceEntityObject {
	id: string;
	uid?: string;
	name?: string;
	slug?: string;
	avatarUrl?: string;
	owner?: UserEntityObject;
	members?: MemberEntityObject[];
	invites?: InviteEntityObject[];
	disabled?: boolean | null;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface WorkspaceEntityObjectOptions {
	sign_files?: boolean;
	duration?: number;
	populate_members?: boolean;
	populate_invites?: boolean;
}

export class WorkspaceEntity extends Entity<WorkspaceEntityRaw, WorkspaceEntityExtra, WorkspaceEntityEntities> {
	constructor(data: WorkspaceEntityPopulated = {}, entities: WorkspaceEntityEntities = {}) {
		const { avatar, owner, members, invites, ...normalData } = data;
		const dataEntities = { ...entities };

		if (avatar && !dataEntities.avatar && typeof avatar === 'object') {
			dataEntities.avatar = new FileEntity(avatar);
		}

		if (owner && !dataEntities.owner && typeof owner === 'object') {
			dataEntities.owner = new UserEntity(owner);
		}

		if (members && !dataEntities.members) {
			dataEntities.members = MemberEntity.fromList(members);
		}

		if (invites && !dataEntities.invites) {
			dataEntities.invites = InviteEntity.fromList(invites);
		}

		super({
			data: normalData,
			extra: { avatar, owner, members, invites },
			entities: dataEntities
		});
	}

	async toObject(options: WorkspaceEntityObjectOptions = {}): Promise<WorkspaceEntityObject> {
		const [avatar, owner, members, invites] = await Promise.all([
			this.entities.avatar?.toObject({
				sign_file: options.sign_files,
				duration: options.duration
			}),
			this.entities.owner?.toObject(options),
			options.populate_members && this.entities.members
				? Promise.all(this.entities.members.items.map(member => member.toObject(options)))
				: undefined,
			options.populate_invites && this.entities.invites
				? Promise.all(this.entities.invites.items.map(invite => invite.toObject(options)))
				: undefined
		]);

		return {
			id: this.id,
			uid: this.data.uid,
			name: this.data.name,
			slug: this.data.slug,
			avatarUrl: avatar?.url,
			owner,
			...(options.populate_members && { members }),
			...(options.populate_invites && { invites }),
			createdAt: this.data.createdAt,
			updatedAt: this.data.updatedAt
		};
	}

	async create() {
		const { id: _temporaryId, ...data } = this.toRaw();
		const createdWorkspace = await this.db.workspace.create({
			data: data as Prisma.WorkspaceUncheckedCreateInput
		});

		Object.assign(this.original, createdWorkspace);
		this.changes = {};
	}

	async update() {
		const updatedWorkspace = await this.db.workspace.update({
			where: {
				id: this.id
			},
			data: this.changes as Prisma.WorkspaceUncheckedUpdateInput
		});

		Object.assign(this.original, updatedWorkspace);
		this.changes = {};
	}

	async delete() {
		await this.db.workspace.delete({
			where: {
				id: this.id
			}
		});

		await super.delete();
	}

	static fromList(dataList: WorkspaceEntityPopulated[]) {
		return new EntityGroup(dataList.map(data => new WorkspaceEntity(data)));
	}
}

import { Conversation, Integration, Prisma, Workspace } from '@wppsync/database';

import { Entity } from '../Entity.js';
import { EntityGroup } from '../Group.js';
import { IntegrationEntity } from '../integrations/integration.entity.js';
import { WorkspaceEntity } from '../workspaces/workspace.entity.js';
import {
	ConversationParticipantEntity,
	ConversationParticipantEntityObject,
	ConversationParticipantEntityPopulated
} from './conversation-participant.entity.js';
import { MessageEntity, MessageEntityObject, MessageEntityPopulated } from './message.entity.js';

export type ConversationEntityRaw = Partial<Conversation>;
export type ConversationEntityExtra = {
	workspace?: Workspace | null;
	integration?: Integration | null;
	participants?: ConversationParticipantEntityPopulated[] | null;
	messages?: MessageEntityPopulated[] | null;
};
export type ConversationEntityEntities = {
	workspace?: WorkspaceEntity | null;
	integration?: IntegrationEntity | null;
	participants?: EntityGroup<ConversationParticipantEntity> | null;
	messages?: EntityGroup<MessageEntity> | null;
};

export type ConversationEntityPopulated = ConversationEntityRaw & ConversationEntityExtra;

export type ConversationEntityObject = {
	id: string;
	name?: string;
	status?: Conversation['status'];
	lastActivityAt?: Date;
	closedAt?: Date;
	workspaceId?: string;
	workspace?: Awaited<ReturnType<WorkspaceEntity['toObject']>>;
	integrationId?: string;
	integration?: Awaited<ReturnType<IntegrationEntity['toObject']>>;
	participants?: ConversationParticipantEntityObject[];
	messages?: MessageEntityObject[];
	createdAt?: Date;
	updatedAt?: Date;
};

export class ConversationEntity extends Entity<
	ConversationEntityRaw,
	ConversationEntityExtra,
	ConversationEntityEntities
> {
	constructor(data: ConversationEntityPopulated = {}, entities: ConversationEntityEntities = {}) {
		const normalData = {
			...data,
			workspace: undefined,
			integration: undefined,
			participants: undefined,
			messages: undefined
		};
		const extra = {
			workspace: data.workspace,
			integration: data.integration,
			participants: data.participants,
			messages: data.messages
		};

		const dataEntities: ConversationEntityEntities = { ...entities };

		if (data.workspace && !entities.workspace) {
			dataEntities.workspace = new WorkspaceEntity(data.workspace);
		}

		if (data.integration && !entities.integration) {
			dataEntities.integration = new IntegrationEntity(data.integration);
		}

		if (data.participants && !entities.participants) {
			dataEntities.participants = ConversationParticipantEntity.fromList(data.participants);
		}

		if (data.messages && !entities.messages) {
			dataEntities.messages = MessageEntity.fromList(data.messages);
		}

		super({ data: normalData, extra, entities: dataEntities });
	}

	async toObject(options: { sign_files?: boolean } = {}): Promise<ConversationEntityObject> {
		return {
			id: this.id,
			...(this.data.name != null && { name: this.data.name }),
			status: this.data.status,
			lastActivityAt: this.data.lastActivityAt,
			...(this.data.closedAt != null && { closedAt: this.data.closedAt }),

			...(this.entities.workspace && {
				workspace: await this.entities.workspace.toObject({ sign_files: options.sign_files })
			}),

			...(!this.entities.integration &&
				this.data.integrationId != null && {
					integrationId: this.data.integrationId
				}),
			...(this.entities.integration && {
				integration: await this.entities.integration.toObject({})
			}),

			...(this.entities.participants && {
				participants: await this.entities.participants.toObject(options)
			}),
			...(this.entities.messages && {
				messages: await this.entities.messages.toObject(options)
			}),

			createdAt: this.data.createdAt,
			updatedAt: this.data.updatedAt
		};
	}

	async create() {
		const { id: _temporaryId, ...data } = this.toRaw();
		const createdConversation = await this.db.conversation.create({
			data: data as Prisma.ConversationUncheckedCreateInput
		});

		Object.assign(this.original, createdConversation);
		this.changes = {};
	}

	async update() {
		const updatedConversation = await this.db.conversation.update({
			where: {
				id: this.id
			},
			data: this.changes as Prisma.ConversationUncheckedUpdateInput
		});

		Object.assign(this.original, updatedConversation);
		this.changes = {};
	}

	async delete() {
		await this.db.conversation.delete({
			where: {
				id: this.id
			}
		});

		await super.delete();
	}

	static fromList(dataList: ConversationEntityPopulated[]) {
		return new EntityGroup(dataList.map(data => new ConversationEntity(data)));
	}
}

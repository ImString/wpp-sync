import { Conversation, Message, Prisma } from '@wppsync/database';

import { Entity } from '../Entity.js';
import { EntityGroup } from '../Group.js';
import { ConversationEntity } from './conversation.entity.js';
import {
	ConversationParticipantEntity,
	ConversationParticipantEntityObject,
	ConversationParticipantEntityPopulated
} from './conversation-participant.entity.js';

export type MessageEntityRaw = Partial<Message>;
export type MessageEntityExtra = {
	conversation?: Conversation | null;
	sender?: ConversationParticipantEntityPopulated | null;
};
export type MessageEntityEntities = {
	conversation?: ConversationEntity | null;
	sender?: ConversationParticipantEntity | null;
};

export type MessageEntityPopulated = MessageEntityRaw & MessageEntityExtra;

export type MessageEntityObject = {
	id: string;
	position?: string;
	type?: Message['type'];
	text?: string;
	payload?: Exclude<Message['payload'], null>;
	externalId?: string;
	conversationId?: string;
	conversation?: Awaited<ReturnType<ConversationEntity['toObject']>>;
	senderParticipantId?: string;
	sender?: ConversationParticipantEntityObject;
	createdAt?: Date;
	editedAt?: Date;
	deletedAt?: Date;
};

export class MessageEntity extends Entity<MessageEntityRaw, MessageEntityExtra, MessageEntityEntities> {
	constructor(data: MessageEntityPopulated = {}, entities: MessageEntityEntities = {}) {
		const normalData = { ...data, conversation: undefined, sender: undefined };
		const extra = { conversation: data.conversation, sender: data.sender };

		const dataEntities: MessageEntityEntities = { ...entities };

		if (data.conversation && !entities.conversation) {
			dataEntities.conversation = new ConversationEntity(data.conversation);
		}

		if (data.sender && !entities.sender) {
			dataEntities.sender = new ConversationParticipantEntity(data.sender);
		}

		super({ data: normalData, extra, entities: dataEntities });
	}

	async toObject(options: { sign_files?: boolean } = {}): Promise<MessageEntityObject> {
		return {
			id: this.id,
			position: this.data.position?.toString(),
			type: this.data.type,
			...(this.data.text != null && { text: this.data.text }),
			...(this.data.payload != null && { payload: this.data.payload }),
			...(this.data.externalId != null && { externalId: this.data.externalId }),

			...(!this.entities.conversation && this.data.conversationId != null && {
				conversationId: this.data.conversationId
			}),
			...(this.entities.conversation && {
				conversation: await this.entities.conversation.toObject(options)
			}),

			...(!this.entities.sender && this.data.senderParticipantId != null && {
				senderParticipantId: this.data.senderParticipantId
			}),
			...(this.entities.sender && {
				sender: await this.entities.sender.toObject(options)
			}),

			createdAt: this.data.createdAt,
			...(this.data.editedAt != null && { editedAt: this.data.editedAt }),
			...(this.data.deletedAt != null && { deletedAt: this.data.deletedAt })
		};
	}

	async create() {
		const { id: _temporaryId, ...data } = this.toRaw();
		const createdMessage = await this.db.message.create({
			data: data as Prisma.MessageUncheckedCreateInput
		});

		Object.assign(this.original, createdMessage);
		this.changes = {};
	}

	async update() {
		const updatedMessage = await this.db.message.update({
			where: {
				id: this.id
			},
			data: this.changes as Prisma.MessageUncheckedUpdateInput
		});

		Object.assign(this.original, updatedMessage);
		this.changes = {};
	}

	async delete() {
		await this.db.message.delete({
			where: {
				id: this.id
			}
		});

		await super.delete();
	}

	static fromList(dataList: MessageEntityPopulated[]) {
		return new EntityGroup(dataList.map(data => new MessageEntity(data)));
	}
}

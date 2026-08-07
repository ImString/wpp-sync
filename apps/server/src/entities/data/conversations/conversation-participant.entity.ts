import { Contact, Conversation, ConversationParticipant, Member, Message, Prisma } from '@wppsync/database';

import { Entity } from '../Entity.js';
import { EntityGroup } from '../Group.js';
import { ContactEntity } from '../contacts/contact.entity.js';
import { MemberEntity } from '../workspaces/members.entity.js';
import { ConversationEntity } from './conversation.entity.js';
import { MessageEntity, MessageEntityObject, MessageEntityPopulated } from './message.entity.js';

export type ConversationParticipantEntityRaw = Partial<ConversationParticipant>;
export type ConversationParticipantEntityExtra = {
	conversation?: Conversation | null;
	member?: Member | null;
	contact?: Contact | null;
	sentMessages?: MessageEntityPopulated[] | null;
};
export type ConversationParticipantEntityEntities = {
	conversation?: ConversationEntity | null;
	member?: MemberEntity | null;
	contact?: ContactEntity | null;
	sentMessages?: EntityGroup<MessageEntity> | null;
};

export type ConversationParticipantEntityPopulated = ConversationParticipantEntityRaw &
	ConversationParticipantEntityExtra;

export type ConversationParticipantEntityObject = {
	id: string;
	type?: ConversationParticipant['type'];
	name?: string;
	email?: string;
	conversationId?: string;
	conversation?: Awaited<ReturnType<ConversationEntity['toObject']>>;
	memberId?: string;
	member?: Awaited<ReturnType<MemberEntity['toObject']>>;
	contactId?: string;
	contact?: Awaited<ReturnType<ContactEntity['toObject']>>;
	sentMessages?: MessageEntityObject[];
	active: boolean;
	joinedAt?: Date;
	leftAt?: Date;
	lastReadPosition?: string;
	lastReadAt?: Date;
};

export class ConversationParticipantEntity extends Entity<
	ConversationParticipantEntityRaw,
	ConversationParticipantEntityExtra,
	ConversationParticipantEntityEntities
> {
	constructor(
		data: ConversationParticipantEntityPopulated = {},
		entities: ConversationParticipantEntityEntities = {}
	) {
		const normalData = {
			...data,
			conversation: undefined,
			member: undefined,
			contact: undefined,
			sentMessages: undefined
		};
		const extra = {
			conversation: data.conversation,
			member: data.member,
			contact: data.contact,
			sentMessages: data.sentMessages
		};

		const dataEntities: ConversationParticipantEntityEntities = { ...entities };

		if (data.conversation && !entities.conversation) {
			dataEntities.conversation = new ConversationEntity(data.conversation);
		}

		if (data.member && !entities.member) {
			dataEntities.member = new MemberEntity(data.member);
		}

		if (data.contact && !entities.contact) {
			dataEntities.contact = new ContactEntity(data.contact);
		}

		if (data.sentMessages && !entities.sentMessages) {
			dataEntities.sentMessages = MessageEntity.fromList(data.sentMessages);
		}

		super({ data: normalData, extra, entities: dataEntities });
	}

	async toObject(options: { sign_files?: boolean } = {}): Promise<ConversationParticipantEntityObject> {
		return {
			id: this.id,
			type: this.data.type,
			...(this.data.name != null && { name: this.data.name }),
			...(this.data.email != null && { email: this.data.email }),

			...(this.entities.conversation && {
				conversation: await this.entities.conversation.toObject(options)
			}),

			...(!this.entities.member &&
				this.data.memberId != null && {
					memberId: this.data.memberId
				}),
			...(this.entities.member && {
				member: await this.entities.member.toObject({ sign_files: options.sign_files })
			}),

			...(!this.entities.contact &&
				this.data.contactId != null && {
					contactId: this.data.contactId
				}),
			...(this.entities.contact && {
				contact: await this.entities.contact.toObject({ sign_files: options.sign_files })
			}),

			...(this.entities.sentMessages && {
				sentMessages: await this.entities.sentMessages.toObject(options)
			}),

			active: !this.data.leftAt,
			joinedAt: this.data.joinedAt,
			...(this.data.leftAt != null && { leftAt: this.data.leftAt }),
			lastReadPosition: this.data.lastReadPosition?.toString(),
			...(this.data.lastReadAt != null && { lastReadAt: this.data.lastReadAt })
		};
	}

	async create() {
		const { id: _temporaryId, ...data } = this.toRaw();
		const createdParticipant = await this.db.conversationParticipant.create({
			data: data as Prisma.ConversationParticipantUncheckedCreateInput
		});

		Object.assign(this.original, createdParticipant);
		this.changes = {};
	}

	async update() {
		const updatedParticipant = await this.db.conversationParticipant.update({
			where: {
				id: this.id
			},
			data: this.changes as Prisma.ConversationParticipantUncheckedUpdateInput
		});

		Object.assign(this.original, updatedParticipant);
		this.changes = {};
	}

	async delete() {
		await this.db.conversationParticipant.delete({
			where: {
				id: this.id
			}
		});

		await super.delete();
	}

	static fromList(dataList: ConversationParticipantEntityPopulated[]) {
		return new EntityGroup(dataList.map(data => new ConversationParticipantEntity(data)));
	}
}

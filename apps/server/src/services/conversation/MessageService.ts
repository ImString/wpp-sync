import { MessageType, prisma, Prisma } from '@wppsync/database';

import { Provider } from '@/core/index.js';

import { ConversationEntity, ConversationParticipantEntity, MessageEntity } from '@/entities/data/index.js';
import {
	ConversationClosedError,
	ConversationNotFoundError,
	ConversationParticipantNotFoundError,
	InvalidMessageError,
	MessageNotFoundError
} from '@/entities/errors/conversation/index.js';

export type MessageServiceWhereInput = Prisma.MessageWhereInput;
export type MessageServiceWhereOptions = {
	id?: string;
	ids?: string[];

	conversationId?: string;
	cursor?: number;
	limit?: number;

	workspace?: string;
};

export type MessageSendDocument = {
	workspace: string;
	conversation: ConversationEntity;

	text?: string;
	payload?: Prisma.InputJsonValue;
	externalId?: string;
} & (
	| {
			type?: Exclude<MessageType, 'SYSTEM'>;
			sender: ConversationParticipantEntity;
	  }
	| {
			type: 'SYSTEM';
			sender?: never;
	  }
);

@Provider()
export class MessageService {
	private mountWhere(options: MessageServiceWhereOptions): MessageServiceWhereInput {
		return {
			...(options.id && { id: options.id }),
			...(options.ids && { id: { in: options.ids } }),

			...(options.conversationId && { conversationId: options.conversationId }),
			...(options.cursor && {
				position: {
					lt: BigInt(options.cursor)
				}
			}),

			...(options.workspace && {
				conversation: {
					workspaceId: options.workspace
				}
			})
		};
	}

	private mountInclude(): Prisma.MessageInclude {
		return {
			sender: {
				include: {
					member: {
						include: {
							user: {
								include: {
									avatar: true
								}
							}
						}
					},
					contact: {
						include: {
							stage: true
						}
					}
				}
			}
		};
	}
	async list(options: MessageServiceWhereOptions) {
		const limit = options.limit ?? 30;

		const dataList = await prisma.message.findMany({
			where: {
				...this.mountWhere(options)
			},
			include: {
				...this.mountInclude()
			},
			orderBy: {
				position: 'desc'
			},
			take: limit + 1
		});

		const hasMore = dataList.length > limit;
		const page = hasMore ? dataList.slice(0, limit) : dataList;
		const nextCursor = page.at(-1)?.position.toString();

		const items = await MessageEntity.fromList([...page].reverse()).toObject({ sign_files: true });

		return {
			items,
			hasMore,
			...(hasMore && nextCursor && { nextCursor })
		};
	}

	async get(options: MessageServiceWhereOptions) {
		const data = await prisma.message.findFirst({
			where: {
				...this.mountWhere(options)
			},
			include: {
				...this.mountInclude()
			}
		});

		if (!data) throw new MessageNotFoundError();

		return new MessageEntity(data);
	}

	async sendMessage(document: MessageSendDocument) {
		if (document.conversation.data.workspaceId !== document.workspace) {
			throw new ConversationNotFoundError();
		}

		if (document.conversation.data.status !== 'OPEN') {
			throw new ConversationClosedError();
		}

		const type = document.type ?? 'TEXT';
		const text = document.text?.trim();

		if (type === 'TEXT' && !text) {
			throw new InvalidMessageError();
		}

		if (type !== 'TEXT' && !text && document.payload === undefined) {
			throw new InvalidMessageError();
		}

		if (
			document.sender &&
			(document.sender.data.conversationId !== document.conversation.id || document.sender.data.leftAt != null)
		) {
			throw new ConversationParticipantNotFoundError();
		}

		const createdAt = new Date();

		const messageData = await prisma.$transaction(async transaction => {
			if (document.sender) {
				const senderExists = await transaction.conversationParticipant.findFirst({
					where: {
						id: document.sender.id,
						conversationId: document.conversation.id,
						leftAt: null
					},
					select: {
						id: true
					}
				});

				if (!senderExists) {
					throw new ConversationParticipantNotFoundError();
				}
			}

			const conversationUpdate = await transaction.conversation.updateMany({
				where: {
					id: document.conversation.id,
					workspaceId: document.workspace,
					status: 'OPEN'
				},
				data: {
					lastActivityAt: createdAt
				}
			});

			if (conversationUpdate.count === 0) {
				throw new ConversationClosedError();
			}

			return transaction.message.create({
				data: {
					type,
					createdAt,
					conversationId: document.conversation.id,

					...(document.sender && {
						senderParticipantId: document.sender.id
					}),

					...(text && { text }),
					...(document.payload !== undefined && {
						payload: document.payload
					}),
					...(document.externalId && {
						externalId: document.externalId
					})
				},
				include: this.mountInclude()
			});
		});

		return new MessageEntity(messageData);
	}
}

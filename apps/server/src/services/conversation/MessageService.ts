import type { MultipartFile } from '@fastify/multipart';
import { MessageType, prisma, Prisma } from '@wppsync/database';

import { Provider } from '@/core/index.js';

import { SocketRooms } from '@/modules/index.js';
import { SocketModule } from '@/modules/modules.js';

import { FilesService } from '@/services/FilesService.js';

import { ConversationEntity, ConversationParticipantEntity, FileEntity, MessageEntity } from '@/entities/data/index.js';
import { ConversationSocketDTO } from '@/entities/dtos/sockets/conversation.dto.js';
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
	files?: MultipartFile[];
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

interface UploadedMessageFile {
	entity: FileEntity;
	mimeType: string;
	name: string;
	size: number;
}

interface MessageCreateDocument {
	type: MessageType;
	text?: string;
	payload?: Prisma.InputJsonValue;
	externalId?: string;
}

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

	async send(document: MessageSendDocument) {
		if (document.conversation.data.workspaceId !== document.workspace) {
			throw new ConversationNotFoundError();
		}

		if (document.conversation.data.status !== 'OPEN') {
			throw new ConversationClosedError();
		}

		const type = document.type ?? 'TEXT';
		const text = document.text?.trim();
		const files = document.files ?? [];

		if (files.length === 0 && type === 'TEXT' && !text) {
			throw new InvalidMessageError();
		}

		if (files.length === 0 && type !== 'TEXT' && !text && document.payload === undefined) {
			throw new InvalidMessageError();
		}

		if (files.length > 0 && type === 'SYSTEM') {
			throw new InvalidMessageError();
		}

		if (
			document.sender &&
			(document.sender.data.conversationId !== document.conversation.id || document.sender.data.leftAt != null)
		) {
			throw new ConversationParticipantNotFoundError();
		}

		const uploadedFiles = await this.uploadFiles(document, files);
		const messages =
			uploadedFiles.length > 0
				? uploadedFiles.map<MessageCreateDocument>((file, index) => ({
						type: this.getFileMessageType(file.mimeType),
						...(index === uploadedFiles.length - 1 && text && { text }),
						payload: {
							fileId: file.entity.id,
							name: file.name,
							mimeType: file.mimeType,
							size: file.size
						},
						...(index === uploadedFiles.length - 1 &&
							document.externalId && {
								externalId: document.externalId
							})
					}))
				: [
						{
							type,
							...(text && { text }),
							...(document.payload !== undefined && { payload: document.payload }),
							...(document.externalId && { externalId: document.externalId })
						}
					];

		const createdData = await this.create(document, messages).catch(async error => {
			await this.deleteUploadedFiles(uploadedFiles);
			throw error;
		});

		const conversation = new ConversationEntity(createdData.conversation, document.conversation.entities);
		const messageEntities = createdData.messages.map(data => new MessageEntity(data));
		const [conversationObject, messageObjects] = await Promise.all([
			conversation.toObject({ sign_files: true }),
			Promise.all(messageEntities.map(message => message.toObject({ sign_files: true })))
		]);

		for (const message of messageObjects) {
			SocketModule.emitTo(
				SocketRooms.conversation(document.conversation.id),
				ConversationSocketDTO.ReceiveMessage,
				{
					conversation: conversationObject,
					message
				}
			);
		}

		return messageEntities;
	}

	private async create(document: MessageSendDocument, messages: MessageCreateDocument[]) {
		const createdAt = new Date();

		return prisma.$transaction(async transaction => {
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

			const [updatedConversation] = await transaction.conversation.updateManyAndReturn({
				where: {
					id: document.conversation.id,
					workspaceId: document.workspace,
					status: 'OPEN'
				},
				data: {
					lastActivityAt: createdAt
				}
			});

			if (!updatedConversation) {
				throw new ConversationClosedError();
			}

			const createdMessages = [];

			for (const message of messages) {
				createdMessages.push(
					await transaction.message.create({
						data: {
							type: message.type,
							createdAt,
							conversationId: document.conversation.id,

							...(document.sender && {
								senderParticipantId: document.sender.id
							}),

							...(message.text && { text: message.text }),
							...(message.payload !== undefined && { payload: message.payload }),
							...(message.externalId && { externalId: message.externalId })
						},
						include: this.mountInclude()
					})
				);
			}

			return {
				conversation: updatedConversation,
				messages: createdMessages
			};
		});
	}

	private async uploadFiles(document: MessageSendDocument, files: MultipartFile[]) {
		const uploadedFiles: UploadedMessageFile[] = [];

		try {
			for (const file of files) {
				const buffer = await file.toBuffer();
				const entity = await FilesService.upload({
					buffer,
					name: file.filename,
					mime_type: file.mimetype,
					prefix: `workspaces/${document.workspace}/conversations/messages`
				});

				uploadedFiles.push({
					entity,
					mimeType: file.mimetype || 'application/octet-stream',
					name: file.filename,
					size: buffer.byteLength
				});
			}

			return uploadedFiles;
		} catch (error) {
			await this.deleteUploadedFiles(uploadedFiles);
			throw error;
		}
	}

	private async deleteUploadedFiles(files: UploadedMessageFile[]) {
		await Promise.allSettled(files.map(file => file.entity.delete()));
	}

	private getFileMessageType(mimeType: string): Exclude<MessageType, 'TEXT' | 'SYSTEM'> {
		if (mimeType.startsWith('image/')) return 'IMAGE';
		if (mimeType.startsWith('audio/')) return 'AUDIO';
		if (mimeType.startsWith('video/')) return 'VIDEO';

		return 'FILE';
	}
}

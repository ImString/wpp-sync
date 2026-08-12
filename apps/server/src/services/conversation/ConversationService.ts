import { applyPrismaPagination, ConversationStatus, PaginationOptions, prisma, Prisma } from '@wppsync/database';

import { Provider } from '@/core/index.js';

import { SocketRooms } from '@/modules/index.js';
import { SocketModule } from '@/modules/modules.js';

import { ContactEntity, ConversationEntity, IntegrationEntity, MemberEntity } from '@/entities/data/index.js';
import { ConversationSocketDTO } from '@/entities/dtos/sockets/conversation.dto.js';
import { ContactNotFoundError } from '@/entities/errors/contact/ContactNotFoundError.js';
import { ConversationNotFoundError } from '@/entities/errors/conversation/ConversationNotFoundError.js';
import { InvalidConversationParticipantError } from '@/entities/errors/conversation/index.js';
import { IntegrationNotFoundError } from '@/entities/errors/integration/IntegrationNotFoundError.js';
import { MemberNotFoundError } from '@/entities/errors/workspace/index.js';

export type ConversationServiceWhereInput = Prisma.ConversationWhereInput;
export type ConversationServiceWhereOptions = {
	id?: string;
	ids?: string[];

	participantId?: string;

	search?: string;
	status?: ConversationStatus;
	integration?: string;
	workspace?: string;
	workspaceUID?: string;

	include?: Prisma.ConversationInclude;
	populate_participants?: boolean;
	populate_messages?: boolean;
	messages_limit?: number;
	ignore_count?: boolean;
};

export type ConversationCreateParticipantDocument =
	| {
			member: MemberEntity;
			contact?: never;
			visitor?: never;
	  }
	| {
			member?: never;
			contact: ContactEntity;
			visitor?: never;
	  }
	| {
			member?: never;
			contact?: never;
			visitor: {
				name: string;
				email: string;
			};
	  };

@Provider()
export class ConversationService {
	private mountWhere(options: ConversationServiceWhereOptions): ConversationServiceWhereInput {
		return {
			...(options.id && { id: options.id }),
			...(options.ids && { id: { in: options.ids } }),

			...(options.participantId && {
				participants: {
					some: {
						OR: [
							{ id: options.participantId },
							{ memberId: options.participantId },
							{ contactId: options.participantId }
						]
					}
				}
			}),

			...(options.search && {
				OR: [
					{
						name: {
							contains: options.search,
							mode: 'insensitive'
						}
					},
					{
						participants: {
							some: {
								leftAt: null,
								OR: [
									{ name: { contains: options.search, mode: 'insensitive' } },
									{ email: { contains: options.search, mode: 'insensitive' } },
									{
										contact: {
											isDeleted: false,
											OR: [
												{ name: { contains: options.search, mode: 'insensitive' } },
												{ pushName: { contains: options.search, mode: 'insensitive' } },
												{ whatsapp: { contains: options.search, mode: 'insensitive' } },
												{ email: { contains: options.search, mode: 'insensitive' } }
											]
										}
									}
								]
							}
						}
					}
				]
			}),

			...(options.status && { status: options.status }),
			...(options.integration && { integrationId: options.integration }),
			...(options.workspace && { workspaceId: options.workspace }),
			...(options.workspaceUID && { workspace: { uid: options.workspaceUID } })
		};
	}

	private mountInclude(options: ConversationServiceWhereOptions): Prisma.ConversationInclude {
		return {
			...options.include,
			...(options.populate_participants && {
				participants: {
					where: {
						leftAt: null
					},
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
			}),
			...(options.populate_messages && {
				messages: {
					orderBy: {
						position: 'desc'
					},
					take: Math.max(1, options.messages_limit || 4),
					include: {
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
					}
				}
			})
		};
	}

	async list(options: ConversationServiceWhereOptions & PaginationOptions) {
		const dataListQuery = prisma.conversation.findMany({
			where: {
				...this.mountWhere(options)
			},
			include: {
				...this.mountInclude(options)
			},
			orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
			...applyPrismaPagination(options)
		});

		let dataList: Awaited<typeof dataListQuery>;
		let dataListTotal: number | undefined;

		if (options.ignore_count) {
			dataList = await dataListQuery;
		} else {
			[dataList, dataListTotal] = await prisma.$transaction([
				dataListQuery,
				prisma.conversation.count({
					where: {
						...this.mountWhere(options)
					}
				})
			]);
		}

		const conversations = ConversationEntity.fromList(dataList);
		const items = await conversations.toObject({ sign_files: true });

		return {
			items,
			...(!options.ignore_count && { total: dataListTotal })
		};
	}

	async get(options: ConversationServiceWhereOptions) {
		const data = await prisma.conversation.findFirst({
			where: {
				...this.mountWhere(options)
			},
			include: {
				...this.mountInclude(options)
			}
		});

		if (!data) throw new ConversationNotFoundError();

		return new ConversationEntity(data);
	}

	async create(document: {
		name?: string;
		workspace: string;
		integration: IntegrationEntity;
		participants: ConversationCreateParticipantDocument[];
	}) {
		if (document.integration.data.workspaceId !== document.workspace || document.integration.data.isDeleted) {
			throw new IntegrationNotFoundError();
		}

		const participants = new Map<
			string,
			| { type: 'MEMBER'; memberId: string; contactId?: never; name?: never; email?: never }
			| { type: 'CONTACT'; memberId?: never; contactId: string; name?: never; email?: never }
			| { type: 'VISITOR'; memberId?: never; contactId?: never; name: string; email: string }
		>();

		for (const participant of document.participants) {
			const participantTypes = [participant.member, participant.contact, participant.visitor].filter(Boolean);

			if (participantTypes.length !== 1) {
				throw new InvalidConversationParticipantError();
			}

			if (participant.member) {
				if (participant.member.data.workspaceId !== document.workspace || participant.member.data.disabled) {
					throw new MemberNotFoundError();
				}

				participants.set(`member:${participant.member.id}`, {
					type: 'MEMBER',
					memberId: participant.member.id
				});
				continue;
			}

			if (participant.contact) {
				if (participant.contact.data.workspaceId !== document.workspace || participant.contact.data.isDeleted) {
					throw new ContactNotFoundError();
				}

				participants.set(`contact:${participant.contact.id}`, {
					type: 'CONTACT',
					contactId: participant.contact.id
				});
				continue;
			}

			if (participant.visitor) {
				const name = participant.visitor.name.trim();
				const email = participant.visitor.email.trim().toLowerCase();

				if (!name || !email) {
					throw new InvalidConversationParticipantError();
				}

				participants.set(`visitor:${email}`, {
					type: 'VISITOR',
					name,
					email
				});
			}
		}

		if (participants.size === 0) {
			throw new InvalidConversationParticipantError();
		}

		const conversationData = await prisma.conversation.create({
			data: {
				name: document.name,
				workspaceId: document.workspace,
				integrationId: document.integration.id,
				participants: {
					create: [...participants.values()]
				}
			},
			include: {
				integration: true,
				participants: {
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
			}
		});

		const conversation = new ConversationEntity(conversationData);

		SocketModule.emitTo(SocketRooms.workspace(document.workspace), ConversationSocketDTO.New, {
			conversation: await conversation.toObject({ sign_files: true })
		});

		return conversation;
	}

	async close(conversation: ConversationEntity) {
		conversation.addChanges({
			status: 'CLOSED',
			closedAt: new Date()
		});

		await conversation.save();

		if (conversation.data.workspaceId) {
			SocketModule.emitTo(
				[
					SocketRooms.workspace(conversation.data.workspaceId),
					SocketRooms.conversation(conversation.id)
				],
				ConversationSocketDTO.Closed,
				{ conversationId: conversation.id }
			);
		}

		return conversation;
	}
}

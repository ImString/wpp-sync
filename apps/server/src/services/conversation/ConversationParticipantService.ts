import { prisma } from '@wppsync/database';

import { Provider } from '@/core/index.js';

import { ConversationEntity, ConversationParticipantEntity, MemberEntity } from '@/entities/data/index.js';
import { MemberNotFoundError } from '@/entities/errors/workspace/index.js';

export type ConversationParticipantJoinMemberDocument = {
	conversation: ConversationEntity;
	member: MemberEntity;
};

@Provider()
export class ConversationParticipantService {
	async joinMember(document: ConversationParticipantJoinMemberDocument) {
		if (
			document.conversation.data.workspaceId !== document.member.data.workspaceId ||
			document.member.data.disabled
		) {
			throw new MemberNotFoundError();
		}

		const participant = await prisma.conversationParticipant.upsert({
			where: {
				conversationId_memberId: {
					conversationId: document.conversation.id,
					memberId: document.member.id
				}
			},
			update: {
				leftAt: null
			},
			create: {
				type: 'MEMBER',
				conversationId: document.conversation.id,
				memberId: document.member.id
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
				}
			}
		});

		return new ConversationParticipantEntity(participant);
	}
}

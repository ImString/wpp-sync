import { $Enums } from '@wppsync/database';
import { Socket } from 'socket.io';

import { SocketHandler, SocketListener, SocketRooms } from '@/modules/index.js';

import { AuthenticationService } from '@/services/AuthenticationService.js';
import { ConversationService, WorkspaceService } from '@/services/index.js';

import { ConversationSocketDTO } from '@/entities/dtos/sockets/conversation.dto.js';
import { InvalidTokenError } from '@/entities/errors/authentication/InvalidTokenError.js';
import { ConversationParticipantNotFoundError } from '@/entities/errors/conversation/index.js';

type UserDataSocket = {
	userID: string;
	userType: $Enums.ConversationParticipantType;
	workspaceUID: string;
	workspaceID?: string;
};

@SocketHandler()
export class ConversationSocket {
	constructor(
		private readonly authenticationService: AuthenticationService,
		private readonly conversationService: ConversationService,
		private readonly workspaceService: WorkspaceService
	) {}

	private async getUserData(socket: Socket, data: { workspaceUID: string }): Promise<UserDataSocket | null> {
		const handshakeToken = socket.handshake.auth?.token;
		const authorization = socket.handshake.headers.authorization;
		const token = typeof handshakeToken === 'string' ? handshakeToken : authorization?.replace(/^Bearer\s+/i, '');

		if (!token) throw new InvalidTokenError();

		const tokenData = this.authenticationService.verifyToken(token);

		if (tokenData.tokenType === 'auth') {
			const userId = tokenData.id;
			const { workspace, membership } = await this.workspaceService.getUserMembership(userId, data.workspaceUID);
			const dbWorkspaceUID = workspace.data.uid;
			if (!dbWorkspaceUID) throw new Error('Workspace UID not found.');

			return {
				userID: membership.id,
				userType: 'MEMBER',
				workspaceID: workspace.id,
				workspaceUID: dbWorkspaceUID
			};
		} else if (tokenData.tokenType === 'visitor') {
			return {
				userID: tokenData.id,
				userType: 'VISITOR',
				workspaceUID: data.workspaceUID
			};
		} else {
			return null;
		}
	}

	@SocketListener(ConversationSocketDTO.Join)
	async join(socket: Socket, data: typeof ConversationSocketDTO.Join.data) {
		try {
			const userData = await this.getUserData(socket, data);
			if (!userData) throw new InvalidTokenError();

			const conversation = await this.conversationService.get({
				...(data.conversationID && { id: data.conversationID }),
				...(!data.conversationID && { participantId: userData.userID }),
				populate_participants: true,
				...(userData.workspaceID
					? { workspace: userData.workspaceID }
					: { workspaceUID: userData.workspaceUID })
			});

			const checkParticipant = conversation.entities.participants?.items.find(
				participant => participant.data.type === userData.userType && participant.data.id === userData.userID
			);
			if (!checkParticipant) throw new ConversationParticipantNotFoundError();

			await socket.join(SocketRooms.conversation(conversation.id));
		} catch (error) {}
	}

	@SocketListener(ConversationSocketDTO.Leave)
	async leave(socket: Socket) {
		const rooms = [...socket.rooms].filter(room => room.startsWith('conversation-'));

		await Promise.all(rooms.map(room => socket.leave(room)));
	}
}

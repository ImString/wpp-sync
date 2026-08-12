import { $Enums } from '@wppsync/database';
import { Socket } from 'socket.io';

import { SocketHandler, SocketListener, SocketRooms } from '@/modules/index.js';

import { AuthenticationService } from '@/services/AuthenticationService.js';
import { ConversationService, WorkspaceService } from '@/services/index.js';

import { ConversationSocketDTO } from '@/entities/dtos/sockets/conversation.dto.js';
import { InvalidTokenError } from '@/entities/errors/authentication/InvalidTokenError.js';

type UserDataSocket = {
	userID: string;
	userType: $Enums.ConversationParticipantType;
	workspaceUID: string;
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

		if (this.authenticationService.verifyToken(token, 'auth')?.id) {
			const userId = this.authenticationService.verifyToken(token, 'auth')?.id;
			const { workspace, membership } = await this.workspaceService.getUserMembership(userId, data.workspaceUID);
			const dbWorkspaceUID = workspace.data.uid;
			if (!dbWorkspaceUID) throw new Error('Workspace UID not found.');

			return {
				userID: membership.id,
				userType: 'MEMBER',
				workspaceUID: dbWorkspaceUID
			};
		} else if (this.authenticationService.verifyToken(token, 'visitor')?.id) {
			const visitorId = this.authenticationService.verifyToken(token, 'visitor')?.id;

			return {
				userID: visitorId,
				userType: 'VISITOR',
				workspaceUID: data.workspaceUID
			};
		} else {
			return null;
		}
	}

	@SocketListener(ConversationSocketDTO.Join)
	async join(socket: Socket, data: typeof ConversationSocketDTO.Join.data) {
		const userData = await this.getUserData(socket, data);
		if (!userData) {
			return;
		}

		const conversation = await this.conversationService
			.get({
				id: data.conversationID,
				populate_participants: true,
				workspace: userData.workspaceUID
			})
			.catch(() => null);
		if (!conversation) {
			return;
		}

		const checkParticipant = conversation.entities.participants?.items.find(
			participant => participant.data.type === userData.userType && participant.data.id === userData.userID
		);
		if (!checkParticipant) {
			return;
		}

		await socket.join(SocketRooms.conversation(data.conversationID));
	}

	@SocketListener(ConversationSocketDTO.Leave)
	async leave(socket: Socket) {
		const rooms = [...socket.rooms].filter(room => room.startsWith('conversation-'));

		await Promise.all(rooms.map(room => socket.leave(room)));
	}
}

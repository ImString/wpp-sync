import type { Socket } from 'socket.io';

import { SocketHandler, SocketListener, SocketRooms } from '@/modules/index.js';

import { AuthenticationService, WorkspaceService } from '@/services/index.js';

import { WorkspaceSocketDTO } from '@/entities/dtos/sockets/workspace.dto.js';
import { InvalidTokenError } from '@/entities/errors/authentication/index.js';

@SocketHandler()
export class WorkspaceSocket {
	constructor(
		private readonly authenticationService: AuthenticationService,
		private readonly workspaceService: WorkspaceService
	) {}

	private getUserId(socket: Socket): string {
		const handshakeToken = socket.handshake.auth?.token;
		const authorization = socket.handshake.headers.authorization;
		const token = typeof handshakeToken === 'string' ? handshakeToken : authorization?.replace(/^Bearer\s+/i, '');

		if (!token) throw new InvalidTokenError();

		return this.authenticationService.verifyToken(token, 'auth').id;
	}

	private async leaveWorkspaceRooms(socket: Socket): Promise<void> {
		const rooms = [...socket.rooms].filter(room => room.startsWith('workspace-') || room.startsWith('member-'));

		await Promise.all(rooms.map(room => socket.leave(room)));
		delete socket.data.workspaceUid;
		delete socket.data.memberId;
	}

	@SocketListener(WorkspaceSocketDTO.Join)
	async join(socket: Socket, data: typeof WorkspaceSocketDTO.Join.data) {
		const userId = this.getUserId(socket);
		const { workspace, membership } = await this.workspaceService.getUserMembership(userId, data.workspaceUID);
		const workspaceUid = workspace.data.uid;

		if (!workspaceUid) throw new Error('Workspace UID not found.');

		await this.leaveWorkspaceRooms(socket);
		await socket.join([SocketRooms.workspace(workspace.id), SocketRooms.member(membership.id)]);

		socket.data.workspaceUid = workspaceUid;
		socket.data.memberId = membership.id;
	}

	@SocketListener(WorkspaceSocketDTO.Leave)
	async leave(socket: Socket) {
		await this.leaveWorkspaceRooms(socket);
	}
}

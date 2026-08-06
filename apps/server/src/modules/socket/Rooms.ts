export const SocketRooms = {
	workspace: (workspaceUid: string) => `workspace-${workspaceUid}`,
	member: (memberId: string) => `member-${memberId}`
};

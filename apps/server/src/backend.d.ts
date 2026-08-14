import type {
	ConversationEntity,
	ConversationParticipantEntity,
	IntegrationEntity,
	MemberEntity,
	WorkspaceEntity
} from './entities/data/index.js';

declare module '@wppsync/backend' {
	interface RouterState {
		userId: string;
		widgetAuthentication?: {
			integration: IntegrationEntity;
			conversation?: ConversationEntity;
			participant?: ConversationParticipantEntity;
		};
		workspaceAccess?: {
			workspace: WorkspaceEntity;
			membership: MemberEntity;
		};
	}
}

export {};

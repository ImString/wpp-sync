export type IntegrationType =
	| 'whatsapp'
	// | 'whatsapp-official'
	// | 'instagram'
	// | 'messenger'
	// | 'email'
	| 'website';

export type IntegrationStatus = 'connected' | 'pending' | 'attention';

export interface Integration {
	id: string;
	name: string;
	type: IntegrationType;
	status: IntegrationStatus;
	account: string;
	lastSync: string;
	conversations: number;
}

export interface IntegrationDraft {
	name: string;
	account: string;
	type: IntegrationType;
}

export interface ChannelDefinition {
	type: IntegrationType;
	name: string;
	description: string;
	accountLabel: string;
	accountPlaceholder: string;
	accent: string;
	softAccent: string;
}

export type IntegrationFilter = 'all' | IntegrationStatus;

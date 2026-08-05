import type { IntegrationData, IntegrationStatusData, IntegrationTypeData } from '@/utils/api';

export type IntegrationType = IntegrationTypeData;
export type IntegrationStatus = IntegrationStatusData;
export type Integration = IntegrationData;

export interface IntegrationDraft {
	name: string;
	type: IntegrationType;
}

export interface ChannelDefinition {
	type: IntegrationType;
	name: string;
	description: string;
	accent: string;
	softAccent: string;
	disabled?: boolean;
}

export type IntegrationFilter = 'all' | IntegrationStatus;

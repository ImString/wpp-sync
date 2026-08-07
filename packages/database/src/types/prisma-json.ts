export interface IntegrationWebConfig {
	headerName: string;
	headerPhotoId?: string;
}

export interface IntegrationWhatsAppConfig {
	instanceId: string;
	phoneNumber?: string;
}

export type IntegrationConfig = IntegrationWebConfig | IntegrationWhatsAppConfig;

declare global {
	namespace PrismaJson {
		type IntegrationConfig = import('./prisma-json.js').IntegrationConfig;
	}
}

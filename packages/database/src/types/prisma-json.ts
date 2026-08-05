export interface IntegrationWebData {
	widgetName: string;
	widgetPhoto: string;
}

export interface IntegrationWhatsAppData {
	instanceId: string;
}

declare global {
	namespace PrismaJson {
		type IntegrationData = IntegrationWebData | IntegrationWhatsAppData;
	}
}

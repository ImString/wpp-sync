export const WhatsAppEventTopic = {
	QR_UPDATED: 'whatsapp.instance.qr.updated.v1',
	CONNECTION_UPDATED: 'whatsapp.instance.connection.updated.v1',
	MESSAGE_RECEIVED: 'whatsapp.instance.message.received.v1',
	MESSAGE_ACKNOWLEDGED: 'whatsapp.instance.message.acknowledged.v1'
} as const;

export type WhatsAppEventTopic = (typeof WhatsAppEventTopic)[keyof typeof WhatsAppEventTopic];

export interface WhatsAppEvent<TData = unknown> {
	eventId: string;
	instanceId: string;
	occurredAt: string;
	data: TData;
}

export type WhatsAppConnectionStatus =
	| 'starting'
	| 'awaiting_qr'
	| 'connected'
	| 'disconnected'
	| 'logged_out'
	| 'error';

export interface WhatsAppConnectionUpdatedData {
	status: WhatsAppConnectionStatus;
	reason?: number;
	message?: string;
}

export interface WhatsAppQrUpdatedData {
	qr: string;
}

function parseBrokers(value: string | undefined): string[] {
	return (value ?? '')
		.split(',')
		.map(item => item.trim())
		.filter(Boolean);
}

export const environment = {
	instanceId: process.env.INSTANCE_ID || 'local-instance',
	host: process.env.HOST || '0.0.0.0',
	port: Number(process.env.PORT || 3000),
	apiToken: process.env.INSTANCE_API_TOKEN || '',
	dataDirectory: process.env.WHATSAPP_DATA_DIR || './data',
	kafka: {
		brokers: parseBrokers(process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER),
		clientId: process.env.KAFKA_CLIENT_ID || 'wpp-whatsapp-instance'
	}
} as const;

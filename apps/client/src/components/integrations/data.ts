import type { ChannelDefinition } from './types';

export const channels: ChannelDefinition[] = [
	{
		type: 'WHATSAPP',
		name: 'WhatsApp',
		description: 'A conexão será disponibilizada quando o fluxo de filas e sessões estiver pronto.',
		accent: '#25d366',
		softAccent: 'rgba(37, 211, 102, .13)',
		disabled: true
	},
	{
		type: 'WEB',
		name: 'Chat do site',
		description: 'Adicione um widget de conversa ao seu site ou landing page.',
		accent: '#8b5cf6',
		softAccent: 'rgba(139, 92, 246, .13)'
	}
];

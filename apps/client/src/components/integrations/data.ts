import type { ChannelDefinition, Integration } from './types';

export const channels: ChannelDefinition[] = [
	{
		type: 'whatsapp',
		name: 'WhatsApp',
		description: 'Conecte um número pelo QR Code e centralize as conversas.',
		accountLabel: 'Número do WhatsApp',
		accountPlaceholder: '+55 (31) 99999-9999',
		accent: '#25d366',
		softAccent: 'rgba(37, 211, 102, .13)'
	},
	// {
	// 	type: 'whatsapp-official',
	// 	name: 'WhatsApp Oficial',
	// 	description: 'Use a API oficial da Meta para operações em maior escala.',
	// 	accountLabel: 'ID da conta comercial',
	// 	accountPlaceholder: 'Ex.: 104829301928301',
	// 	accent: '#19b7a9',
	// 	softAccent: 'rgba(25, 183, 169, .13)'
	// },
	// {
	// 	type: 'instagram',
	// 	name: 'Instagram',
	// 	description: 'Receba e responda mensagens diretas do seu perfil comercial.',
	// 	accountLabel: 'Usuário do Instagram',
	// 	accountPlaceholder: '@suaempresa',
	// 	accent: '#e7468a',
	// 	softAccent: 'rgba(231, 70, 138, .13)'
	// },
	// {
	// 	type: 'messenger',
	// 	name: 'Messenger',
	// 	description: 'Conecte uma página do Facebook ao atendimento da equipe.',
	// 	accountLabel: 'Página do Facebook',
	// 	accountPlaceholder: 'Nome da página',
	// 	accent: '#1686f7',
	// 	softAccent: 'rgba(22, 134, 247, .13)'
	// },
	// {
	// 	type: 'email',
	// 	name: 'E-mail',
	// 	description: 'Transforme mensagens da sua caixa de entrada em atendimentos.',
	// 	accountLabel: 'Endereço de e-mail',
	// 	accountPlaceholder: 'atendimento@suaempresa.com',
	// 	accent: '#f5a524',
	// 	softAccent: 'rgba(245, 165, 36, .13)'
	// },
	{
		type: 'website',
		name: 'Chat do site',
		description: 'Adicione um widget de conversa ao seu site ou landing page.',
		accountLabel: 'Domínio do site',
		accountPlaceholder: 'www.suaempresa.com',
		accent: '#8b5cf6',
		softAccent: 'rgba(139, 92, 246, .13)'
	}
];

export const initialIntegrations: Integration[] = [
	{
		id: 'whatsapp-comercial',
		name: 'WhatsApp Comercial',
		type: 'whatsapp',
		status: 'pending',
		account: '+55 (31) 99942-1087',
		lastSync: 'Aguardando leitura do QR Code',
		conversations: 0
	}
	// {
	// 	id: 'instagram-principal',
	// 	name: 'Instagram Principal',
	// 	type: 'instagram',
	// 	status: 'connected',
	// 	account: '@wppsync',
	// 	lastSync: 'Sincronizado há 2 min',
	// 	conversations: 184
	// },
	// {
	// 	id: 'email-suporte',
	// 	name: 'E-mail de Suporte',
	// 	type: 'email',
	// 	status: 'attention',
	// 	account: 'suporte@wppsync.com',
	// 	lastSync: 'Autenticação expirada',
	// 	conversations: 42
	// }
];

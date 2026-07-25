import type { ChatMessage, Conversation } from './types';

export const conversations: Conversation[] = [
	{
		id: 'juliana-costa',
		name: 'Juliana Costa',
		initials: 'JC',
		preview: 'Olá! Gostaria de saber mais...',
		time: '11:42',
		type: 'unread',
		unread: 2,
		phone: '+55 31 98765-4321',
		avatarClassName: 'from-orange-700 to-cyan-800',
		tags: ['Cliente', 'Lead quente']
	},
	{
		id: 'lucas-mendes',
		name: 'Lucas Mendes',
		initials: 'LM',
		preview: 'Perfeito, obrigado!',
		time: '11:28',
		type: 'unread',
		unread: 1,
		phone: '+55 11 91234-5678',
		avatarClassName: 'from-slate-700 to-orange-400',
		tags: ['Cliente']
	},
	{
		id: 'ana-paula',
		name: 'Ana Paula',
		initials: 'AP',
		preview: 'Vocês têm disponível na cor preta?',
		time: '10:57',
		type: 'waiting',
		phone: '+55 21 99876-5432',
		avatarClassName: 'from-rose-900 to-orange-400',
		tags: ['Aguardando']
	},
	{
		id: 'empresa-alpha',
		name: 'Empresa Alpha',
		initials: 'EA',
		preview: 'Podemos agendar uma reunião.',
		time: '10:45',
		type: 'waiting',
		phone: '+55 31 3333-2100',
		avatarClassName: 'from-emerald-400 to-emerald-700',
		tags: ['Empresa', 'Lead']
	},
	{
		id: 'carlos-eduardo',
		name: 'Carlos Eduardo',
		initials: 'CE',
		preview: 'Pagamento realizado ✅',
		time: 'Ontem',
		type: 'all',
		phone: '+55 41 99111-2233',
		avatarClassName: 'from-slate-800 to-amber-700',
		tags: ['Cliente']
	},
	{
		id: 'patricia-lima',
		name: 'Patrícia Lima',
		initials: 'PL',
		preview: 'Qual o prazo de entrega?',
		time: 'Ontem',
		type: 'all',
		phone: '+55 51 98888-1122',
		avatarClassName: 'from-teal-700 to-orange-300',
		tags: ['Cliente']
	},
	{
		id: 'grupo-vendas',
		name: 'Grupo Vendas',
		displayName: 'Grupo: Vendas',
		initials: 'GV',
		preview: 'Marcos: Bom dia, equipe!',
		time: 'Ontem',
		type: 'groups',
		phone: '8 participantes',
		avatarClassName: 'from-brand-600 to-brand-400',
		tags: ['Grupo']
	}
];

const julianaMessages: ChatMessage[] = [
	{
		id: 'message-1',
		type: 'text',
		direction: 'received',
		text: 'Olá! Gostaria de saber mais sobre seus serviços.',
		time: '11:40'
	},
	{
		id: 'message-2',
		type: 'text',
		direction: 'sent',
		text: 'Olá, Juliana! Claro, vou te enviar as informações.',
		time: '11:41',
		status: 'read'
	},
	{
		id: 'message-3',
		type: 'text',
		direction: 'received',
		text: 'Ótimo! Também gostaria de saber os valores.',
		time: '11:41'
	},
	{
		id: 'message-4',
		type: 'text',
		direction: 'sent',
		text: 'Claro, vou te enviar nossa tabela de preços.',
		time: '11:42',
		status: 'read'
	},
	{
		id: 'message-5',
		type: 'file',
		direction: 'received',
		name: 'Tabela_de_precos.pdf',
		details: 'PDF · 1,2 MB',
		time: '11:42'
	}
];

export const initialMessages: Record<string, ChatMessage[]> = Object.fromEntries(
	conversations.map(conversation => [
		conversation.id,
		conversation.id === 'juliana-costa'
			? julianaMessages
			: [
					{
						id: `${conversation.id}-message`,
						type: 'text',
						direction: 'received',
						text: conversation.preview,
						time: conversation.time
					} satisfies ChatMessage
				]
	])
);

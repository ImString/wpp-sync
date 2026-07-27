import type { Workspace } from './types';

export const initialWorkspaces: Workspace[] = [
	{
		id: 'wppsync-principal',
		name: 'WppSync Principal',
		slug: 'wppsync-principal',
		role: 'owner',
		members: 12,
		connectedChannels: 4,
		lastAccess: 'Ativa agora',
		active: true,
		logoVariant: 'brand',
		segment: 'Atendimento e suporte'
	},
	{
		id: 'agencia-aurora',
		name: 'Agência Aurora',
		slug: 'agencia-aurora',
		role: 'member',
		members: 8,
		connectedChannels: 2,
		lastAccess: 'Último acesso há 2h',
		logoVariant: 'aurora',
		segment: 'Agência'
	},
	{
		id: 'equipe-comercial',
		name: 'Equipe Comercial',
		slug: 'equipe-comercial',
		role: 'member',
		members: 5,
		connectedChannels: 1,
		lastAccess: 'Último acesso ontem',
		logoVariant: 'sales',
		segment: 'Vendas'
	}
];

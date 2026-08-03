import { create } from 'zustand';

import { initialIntegrations } from './data';
import type { Integration, IntegrationDraft } from './types';

interface IntegrationsStore {
	integrations: Integration[];
	createIntegration: (draft: IntegrationDraft) => Integration;
	updateIntegration: (integrationId: string, draft: IntegrationDraft) => void;
	removeIntegration: (integrationId: string) => void;
	restartIntegration: (integrationId: string) => void;
	markSynced: (integrationId: string) => void;
}

const slugify = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

export const useIntegrationsStore = create<IntegrationsStore>(set => ({
	integrations: initialIntegrations,
	createIntegration: draft => {
		// const needsConnection = draft.type === 'whatsapp' || draft.type === 'whatsapp-official';
		const needsConnection = draft.type === 'whatsapp';
		const integration: Integration = {
			id: `${slugify(draft.name) || 'integracao'}-${Date.now()}`,
			...draft,
			status: needsConnection ? 'pending' : 'connected',
			lastSync: needsConnection ? 'Aguardando conexão' : 'Conectado agora',
			conversations: 0
		};

		set(state => ({ integrations: [integration, ...state.integrations] }));
		return integration;
	},
	updateIntegration: (integrationId, draft) =>
		set(state => ({
			integrations: state.integrations.map(integration =>
				integration.id === integrationId ? { ...integration, ...draft } : integration
			)
		})),
	removeIntegration: integrationId =>
		set(state => ({ integrations: state.integrations.filter(integration => integration.id !== integrationId) })),
	restartIntegration: integrationId =>
		set(state => ({
			integrations: state.integrations.map(integration =>
				integration.id === integrationId
					? { ...integration, status: 'pending', lastSync: 'Aguardando nova conexão' }
					: integration
			)
		})),
	markSynced: integrationId =>
		set(state => ({
			integrations: state.integrations.map(integration =>
				integration.id === integrationId ? { ...integration, lastSync: 'Sincronizado agora' } : integration
			)
		}))
}));

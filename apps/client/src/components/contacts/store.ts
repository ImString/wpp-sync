import { create } from 'zustand';

import { formatNationalPhone } from '@/utils';
import {
	contactsAPI,
	getResponseMessage,
	type ContactData,
	type ContactListOptions,
	type ContactStageData
} from '@/utils/api';

import type { Contact, ContactDraft, RelationshipStage, RelationshipStageDraft } from './types';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
export type ContactListQuery = Omit<ContactListOptions, 'signal'>;

interface ContactsStore {
	workspaceUid: string | null;
	contacts: Contact[];
	contactsTotal: number;
	contactsQueryKey: string | null;
	workspaceContactsTotal: number;
	contactDetails: Contact | null;
	stages: RelationshipStage[];
	loadStatus: LoadStatus;
	contactsStatus: LoadStatus;
	error: string | null;
	contactsError: string | null;
	loadData: (uid: string, signal?: AbortSignal, force?: boolean) => Promise<void>;
	loadContacts: (uid: string, query: ContactListQuery, signal?: AbortSignal, force?: boolean) => Promise<void>;
	loadContact: (uid: string, contactId: string, signal?: AbortSignal) => Promise<Contact>;
	createContact: (uid: string, draft: ContactDraft) => Promise<Contact>;
	updateContact: (uid: string, contactId: string, draft: ContactDraft) => Promise<void>;
	deleteContact: (uid: string, contactId: string) => Promise<void>;
	updateNotes: (uid: string, contactId: string, notes: string) => Promise<void>;
	createStage: (uid: string, draft: RelationshipStageDraft) => Promise<RelationshipStage>;
	updateStage: (uid: string, stageId: string, draft: RelationshipStageDraft) => Promise<void>;
	deleteStage: (uid: string, stageId: string, replacementStageId?: string) => Promise<void>;
	moveStage: (uid: string, stageId: string, direction: 'up' | 'down') => Promise<void>;
}

const getErrorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

const getInitials = (name: string) =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map(part => part[0]?.toUpperCase())
		.join('');

const parseTags = (tags: string) =>
	tags
		.split(',')
		.map(tag => tag.trim())
		.filter(Boolean)
		.slice(0, 20);

const normalizeWhatsapp = (phone: string) => {
	return phone.replace(/\D/g, '');
};

const getContactsQueryKey = (uid: string, query: ContactListQuery) =>
	JSON.stringify([
		uid,
		query.page || 1,
		query.limit || 20,
		query.search?.trim() || '',
		query.stage || '',
		query.order || 'recent'
	]);

const mapStage = (stage: ContactStageData, fallbackOrder = 0): RelationshipStage => ({
	id: stage.id,
	name: stage.name,
	slug: stage.slug,
	color: stage.color.startsWith('#') ? stage.color : `#${stage.color}`,
	description: stage.description || '',
	icon: stage.icon,
	order: stage.position ?? fallbackOrder,
	contactCount: stage.contactCount || 0,
	createdAt: stage.createdAt
});

const mapContact = (contact: ContactData): Contact => {
	const name =
		contact.name?.trim() || contact.pushName?.trim() || formatNationalPhone(contact.whatsapp) || contact.whatsapp;

	return {
		id: contact.id,
		name,
		initials: getInitials(name),
		phone: contact.whatsapp,
		email: contact.email || undefined,
		stageId: contact.stageId || contact.stage?.id || undefined,
		tags: contact.tags || [],
		notes: contact.notes || '',
		createdAt: contact.createdAt
	};
};

const toContactPayload = (draft: ContactDraft) => ({
	name: draft.name.trim(),
	whatsapp: normalizeWhatsapp(draft.phone),
	...(draft.email.trim() && { email: draft.email.trim() }),
	...(draft.stageId && { stage: draft.stageId }),
	tags: parseTags(draft.tags)
});

const requireSuccess = <T>(response: { success: boolean; data?: T }, fallback: string): T | undefined => {
	if (!response.success) throw new Error(getResponseMessage(response, fallback));
	return response.data;
};

export const useContactsStore = create<ContactsStore>((set, get) => ({
	workspaceUid: null,
	contacts: [],
	contactsTotal: 0,
	contactsQueryKey: null,
	workspaceContactsTotal: 0,
	contactDetails: null,
	stages: [],
	loadStatus: 'idle',
	contactsStatus: 'idle',
	error: null,
	contactsError: null,
	loadData: async (uid, signal, force = false) => {
		const current = get();
		if (!force && current.workspaceUid === uid && current.loadStatus === 'ready') return;

		set(state => {
			const sameWorkspace = state.workspaceUid === uid;

			return {
				workspaceUid: uid,
				contacts: sameWorkspace ? state.contacts : [],
				contactsTotal: sameWorkspace ? state.contactsTotal : 0,
				contactsQueryKey: sameWorkspace ? state.contactsQueryKey : null,
				workspaceContactsTotal: sameWorkspace ? state.workspaceContactsTotal : 0,
				contactDetails: sameWorkspace ? state.contactDetails : null,
				stages: sameWorkspace ? state.stages : [],
				contactsStatus: sameWorkspace ? state.contactsStatus : 'idle',
				contactsError: sameWorkspace ? state.contactsError : null,
				loadStatus: 'loading',
				error: null
			};
		});

		try {
			const stagesResponse = await contactsAPI.listStages(uid, signal);
			const stagesData = requireSuccess(stagesResponse, 'Não foi possível carregar as etapas de contato.');

			if (signal?.aborted || get().workspaceUid !== uid) return;

			set({
				stages: (stagesData?.items || []).map(mapStage),
				workspaceContactsTotal: stagesData?.contactsTotal || 0,
				loadStatus: 'ready',
				error: null
			});
		} catch (error) {
			if (!signal?.aborted && get().workspaceUid === uid) {
				set({
					loadStatus: 'error',
					error: getErrorMessage(error, 'Não foi possível carregar os contatos.')
				});
			}
			throw error;
		}
	},
	loadContacts: async (uid, query, signal, force = false) => {
		const queryKey = getContactsQueryKey(uid, query);
		const current = get();

		if (!force && current.contactsStatus === 'ready' && current.contactsQueryKey === queryKey) return;

		set(state => {
			const sameWorkspace = state.workspaceUid === uid;

			return {
				workspaceUid: uid,
				contacts: sameWorkspace ? state.contacts : [],
				contactsTotal: sameWorkspace ? state.contactsTotal : 0,
				contactsStatus: 'loading',
				contactsError: null
			};
		});

		try {
			const response = await contactsAPI.list(uid, { ...query, signal });
			const data = requireSuccess(response, 'Não foi possível carregar os contatos.');
			if (!data) throw new Error('A API não retornou a lista de contatos.');

			if (signal?.aborted || get().workspaceUid !== uid) return;

			set({
				contacts: data.items.map(mapContact),
				contactsTotal: data.total,
				contactsQueryKey: queryKey,
				contactsStatus: 'ready',
				contactsError: null
			});
		} catch (error) {
			if (!signal?.aborted && get().workspaceUid === uid) {
				set({
					contactsStatus: 'error',
					contactsError: getErrorMessage(error, 'Não foi possível carregar os contatos.')
				});
			}
			throw error;
		}
	},
	loadContact: async (uid, contactId, signal) => {
		const response = await contactsAPI.get(uid, contactId, signal);
		const data = requireSuccess(response, 'Não foi possível carregar os detalhes do contato.');
		if (!data) throw new Error('A API não retornou os detalhes do contato.');

		const contact = mapContact(data);
		if (!signal?.aborted && get().workspaceUid === uid) set({ contactDetails: contact });
		return contact;
	},
	createContact: async (uid, draft) => {
		const response = await contactsAPI.create(uid, toContactPayload(draft));
		const data = requireSuccess(response, 'Não foi possível adicionar o contato.');
		if (!data) throw new Error('A API não retornou o contato criado.');

		const contact = mapContact(data);
		if (!contact.stageId && draft.stageId) contact.stageId = draft.stageId;
		set(state => ({
			contactDetails: contact,
			workspaceContactsTotal: state.workspaceContactsTotal + 1
		}));
		return contact;
	},
	updateContact: async (uid, contactId, draft) => {
		const response = await contactsAPI.update(uid, contactId, {
			...toContactPayload(draft),
			email: draft.email.trim() || null,
			stage: draft.stageId || null
		});
		requireSuccess(response, 'Não foi possível atualizar o contato.');

		set(state => ({
			contacts: state.contacts.map(contact =>
				contact.id === contactId
					? {
							...contact,
							name: draft.name.trim(),
							initials: getInitials(draft.name),
							phone: normalizeWhatsapp(draft.phone),
							email: draft.email.trim() || undefined,
							stageId: draft.stageId || undefined,
							tags: parseTags(draft.tags)
						}
					: contact
			),
			contactDetails:
				state.contactDetails?.id === contactId
					? {
							...state.contactDetails,
							name: draft.name.trim(),
							initials: getInitials(draft.name),
							phone: normalizeWhatsapp(draft.phone),
							email: draft.email.trim() || undefined,
							stageId: draft.stageId || undefined,
							tags: parseTags(draft.tags)
						}
					: state.contactDetails
		}));
	},
	deleteContact: async (uid, contactId) => {
		const response = await contactsAPI.delete(uid, contactId);
		requireSuccess(response, 'Não foi possível excluir o contato.');
		set(state => ({
			contacts: state.contacts.filter(contact => contact.id !== contactId),
			contactsTotal: Math.max(0, state.contactsTotal - 1),
			workspaceContactsTotal: Math.max(0, state.workspaceContactsTotal - 1),
			contactDetails: state.contactDetails?.id === contactId ? null : state.contactDetails
		}));
	},
	updateNotes: async (uid, contactId, notes) => {
		const response = await contactsAPI.update(uid, contactId, { notes });
		requireSuccess(response, 'Não foi possível salvar a nota.');
		set(state => ({
			contacts: state.contacts.map(contact => (contact.id === contactId ? { ...contact, notes } : contact)),
			contactDetails:
				state.contactDetails?.id === contactId ? { ...state.contactDetails, notes } : state.contactDetails
		}));
	},
	createStage: async (uid, draft) => {
		const response = await contactsAPI.createStage(uid, {
			...draft,
			description: draft.description || undefined
		});
		const data = requireSuccess(response, 'Não foi possível criar a etapa.');
		if (!data) throw new Error('A API não retornou a etapa criada.');

		const stage = mapStage(data, get().stages.length);
		set(state => ({ stages: [...state.stages, stage] }));
		return stage;
	},
	updateStage: async (uid, stageId, draft) => {
		const response = await contactsAPI.updateStage(uid, stageId, {
			...draft,
			description: draft.description || null
		});
		const data = requireSuccess(response, 'Não foi possível atualizar a etapa.');
		if (!data) throw new Error('A API não retornou a etapa atualizada.');
		set(state => ({
			stages: state.stages.map(stage => (stage.id === stageId ? { ...stage, ...draft, slug: data.slug } : stage))
		}));
	},
	deleteStage: async (uid, stageId, replacementStageId) => {
		const response = await contactsAPI.deleteStage(uid, stageId, replacementStageId);
		requireSuccess(response, 'Não foi possível excluir a etapa.');
		set(state => ({
			stages: state.stages
				.filter(stage => stage.id !== stageId)
				.map((stage, order) => ({
					...stage,
					order,
					contactCount:
						stage.id === replacementStageId
							? stage.contactCount + (state.stages.find(item => item.id === stageId)?.contactCount || 0)
							: stage.contactCount
				})),
			contacts: state.contacts.map(contact =>
				contact.stageId === stageId ? { ...contact, stageId: replacementStageId } : contact
			),
			contactDetails:
				state.contactDetails?.stageId === stageId
					? { ...state.contactDetails, stageId: replacementStageId }
					: state.contactDetails
		}));
	},
	moveStage: async (uid, stageId, direction) => {
		const stages = [...get().stages].sort((first, second) => first.order - second.order);
		const index = stages.findIndex(stage => stage.id === stageId);
		const targetIndex = direction === 'up' ? index - 1 : index + 1;

		if (index < 0 || targetIndex < 0 || targetIndex >= stages.length) return;

		[stages[index], stages[targetIndex]] = [stages[targetIndex], stages[index]];
		const reorderedStages = stages.map((stage, order) => ({ ...stage, order }));
		const response = await contactsAPI.reorderStages(
			uid,
			reorderedStages.map(stage => stage.id)
		);
		requireSuccess(response, 'Não foi possível reordenar as etapas.');
		set({ stages: reorderedStages });
	}
}));

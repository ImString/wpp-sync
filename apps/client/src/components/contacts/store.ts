import { create } from 'zustand';

import { initialContacts, initialRelationshipStages } from './data';
import type { Contact, ContactDraft, RelationshipStage, RelationshipStageDraft } from './types';

interface ContactsStore {
	contacts: Contact[];
	stages: RelationshipStage[];
	createContact: (draft: ContactDraft) => Contact;
	updateContact: (contactId: string, draft: ContactDraft) => void;
	toggleFavorite: (contactId: string) => void;
	updateNotes: (contactId: string, notes: string) => void;
	moveContactToStage: (contactId: string, stageId: string) => void;
	createStage: (draft: RelationshipStageDraft) => RelationshipStage;
	updateStage: (stageId: string, draft: RelationshipStageDraft) => void;
	deleteStage: (stageId: string, replacementStageId: string) => void;
	moveStage: (stageId: string, direction: 'up' | 'down') => void;
}

const normalizeText = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();

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
		.slice(0, 6);

export const useContactsStore = create<ContactsStore>(set => ({
	contacts: initialContacts,
	stages: initialRelationshipStages,
	createContact: draft => {
		const contact: Contact = {
			id: `${normalizeText(draft.name)
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '')}-${Date.now()}`,
			name: draft.name,
			initials: getInitials(draft.name),
			phone: draft.phone,
			email: draft.email,
			company: draft.company || undefined,
			city: draft.city,
			stageId: draft.stageId,
			tags: parseTags(draft.tags),
			lastInteraction: 'Agora',
			lastInteractionOrder: Date.now(),
			firstContact: 'Hoje',
			origin: 'Cadastro manual',
			conversations: 0,
			lastMessage: 'Contato adicionado recentemente.',
			notes: ''
		};

		set(state => ({ contacts: [contact, ...state.contacts] }));
		return contact;
	},
	updateContact: (contactId, draft) =>
		set(state => ({
			contacts: state.contacts.map(contact =>
				contact.id === contactId
					? {
							...contact,
							...draft,
							company: draft.company || undefined,
							initials: getInitials(draft.name),
							tags: parseTags(draft.tags)
						}
					: contact
			)
		})),
	toggleFavorite: contactId =>
		set(state => ({
			contacts: state.contacts.map(contact =>
				contact.id === contactId ? { ...contact, favorite: !contact.favorite } : contact
			)
		})),
	updateNotes: (contactId, notes) =>
		set(state => ({
			contacts: state.contacts.map(contact => (contact.id === contactId ? { ...contact, notes } : contact))
		})),
	moveContactToStage: (contactId, stageId) =>
		set(state => ({
			contacts: state.contacts.map(contact => (contact.id === contactId ? { ...contact, stageId } : contact))
		})),
	createStage: draft => {
		const stage: RelationshipStage = {
			id: `stage-${Date.now()}`,
			...draft,
			order: 0
		};

		set(state => ({
			stages: [...state.stages, { ...stage, order: state.stages.length }]
		}));
		return stage;
	},
	updateStage: (stageId, draft) =>
		set(state => ({
			stages: state.stages.map(stage => (stage.id === stageId ? { ...stage, ...draft } : stage))
		})),
	deleteStage: (stageId, replacementStageId) =>
		set(state => ({
			stages: state.stages
				.filter(stage => stage.id !== stageId)
				.sort((first, second) => first.order - second.order)
				.map((stage, order) => ({ ...stage, order })),
			contacts: state.contacts.map(contact =>
				contact.stageId === stageId ? { ...contact, stageId: replacementStageId } : contact
			)
		})),
	moveStage: (stageId, direction) =>
		set(state => {
			const stages = [...state.stages].sort((first, second) => first.order - second.order);
			const index = stages.findIndex(stage => stage.id === stageId);
			const targetIndex = direction === 'up' ? index - 1 : index + 1;

			if (index < 0 || targetIndex < 0 || targetIndex >= stages.length) return state;

			[stages[index], stages[targetIndex]] = [stages[targetIndex], stages[index]];
			return { stages: stages.map((stage, order) => ({ ...stage, order })) };
		})
}));

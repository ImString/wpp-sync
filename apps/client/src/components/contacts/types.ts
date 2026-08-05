import type { StageIconName } from '@wppsync/shared/contact-stages';

export type { StageIconName } from '@wppsync/shared/contact-stages';

export interface RelationshipStage {
	id: string;
	name: string;
	slug: string;
	color: string;
	description: string;
	icon: StageIconName;
	order: number;
	contactCount: number;
	createdAt?: string;
}

export interface Contact {
	id: string;
	name: string;
	initials: string;
	phone: string;
	email?: string;
	stageId?: string;
	tags: string[];
	notes: string;
	createdAt?: string;
}

export interface ContactDraft {
	name: string;
	phone: string;
	email: string;
	stageId: string;
	tags: string;
}

export interface RelationshipStageDraft {
	name: string;
	color: string;
	description: string;
	icon: StageIconName;
}

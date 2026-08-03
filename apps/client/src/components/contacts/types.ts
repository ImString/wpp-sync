export type StageIconName =
	| 'label'
	| 'clock'
	| 'person'
	| 'group'
	| 'star'
	| 'heart'
	| 'chat'
	| 'phone'
	| 'calendar'
	| 'event'
	| 'check'
	| 'hourglass'
	| 'flag'
	| 'target'
	| 'cart'
	| 'money'
	| 'rocket'
	| 'pause'
	| 'warning'
	| 'archive';

export interface RelationshipStage {
	id: string;
	name: string;
	color: string;
	description: string;
	icon: StageIconName;
	order: number;
}

export interface Contact {
	id: string;
	name: string;
	initials: string;
	phone: string;
	email: string;
	company?: string;
	city: string;
	stageId: string;
	tags: string[];
	lastInteraction: string;
	lastInteractionOrder: number;
	firstContact: string;
	origin: string;
	conversations: number;
	lastMessage: string;
	notes: string;
	favorite?: boolean;
}

export interface ContactDraft {
	name: string;
	phone: string;
	email: string;
	company: string;
	city: string;
	stageId: string;
	tags: string;
}

export interface RelationshipStageDraft {
	name: string;
	color: string;
	description: string;
	icon: StageIconName;
}

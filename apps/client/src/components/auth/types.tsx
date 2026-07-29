import type { ReactNode } from 'react';

export interface AuthPreview {
	initials: string;
	name: string;
	message: string;
	time: string;
}

export interface AuthShowcaseContent {
	kicker: string;
	title: ReactNode;
	description: string;
	previews: AuthPreview[];
}

export interface AuthLayoutProps {
	ariaLabel: string;
	eyebrow: string;
	title: string;
	description: string;
	showcase: AuthShowcaseContent;
	children?: ReactNode;
}

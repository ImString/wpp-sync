import type { IconType } from 'react-icons';
import { twMerge } from 'tailwind-merge';

import { Button } from '@/components/buttons';

import { useChatStore } from '../store';
import type { NavigationSection } from '../types';

interface NavigationItemProps {
	icon: IconType;
	label: string;
	section: NavigationSection;
}

export const NavigationItem: React.FC<NavigationItemProps> = props => {
	const activeSection = useChatStore(state => state.activeSection);
	const setActiveSection = useChatStore(state => state.setActiveSection);
	const isActive = activeSection === props.section;

	return (
		<Button
			theme="unstyled"
			type="button"
			className={twMerge('nav-item', isActive ? 'nav-item-active' : 'nav-item-idle')}
			onClick={() => setActiveSection(props.section)}>
			<props.icon aria-hidden="true" />
			<span>{props.label}</span>
		</Button>
	);
};

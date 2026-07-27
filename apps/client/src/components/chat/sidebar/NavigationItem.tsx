import type { IconType } from 'react-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

import { Button } from '@/components/buttons';
import { useWorkspaceStore } from '@/stores';

import { useChatStore } from '../store';
import type { NavigationSection } from '../types';

interface NavigationItemProps {
	icon: IconType;
	label: string;
	section: NavigationSection;
}

export const NavigationItem: React.FC<NavigationItemProps> = props => {
	const location = useLocation();
	const navigate = useNavigate();
	const activeSection = useChatStore(state => state.activeSection);
	const setActiveSection = useChatStore(state => state.setActiveSection);
	const activeWorkspaceSlug = useWorkspaceStore(state => state.activeWorkspaceSlug);
	const isProfilePage = location.pathname === '/profile';
	const isActive = props.section === 'settings' ? isProfilePage : !isProfilePage && activeSection === props.section;

	const handleClick = () => {
		setActiveSection(props.section);

		if (props.section === 'settings') {
			navigate('/profile?context=workspace');
			return;
		}

		if (isProfilePage) navigate(activeWorkspaceSlug ? `/w/${activeWorkspaceSlug}` : '/');
	};

	return (
		<Button
			theme="unstyled"
			type="button"
			className={twMerge('nav-item', isActive ? 'nav-item-active' : 'nav-item-idle')}
			onClick={handleClick}>
			<props.icon aria-hidden="true" />
			<span>{props.label}</span>
		</Button>
	);
};

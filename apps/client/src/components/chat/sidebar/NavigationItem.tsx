import type { IconType } from 'react-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';

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
	const { activeSection, setActiveSection } = useChatStore(
		useShallow(state => ({
			activeSection: state.activeSection,
			setActiveSection: state.setActiveSection
		}))
	);
	const activeWorkspaceUid = useWorkspaceStore(state => state.activeWorkspaceUid);
	const isProfilePage =
		location.pathname === '/profile' ||
		location.pathname.endsWith('/my-profile') ||
		location.pathname.includes('/settings/');
	const routeSection = location.pathname.includes('/integrations')
		? 'integrations'
		: location.pathname.includes('/contacts')
			? 'contacts'
			: location.pathname.includes('/chats')
				? 'chats'
				: activeSection;
	const isActive = props.section === 'settings' ? isProfilePage : !isProfilePage && routeSection === props.section;

	const handleClick = () => {
		setActiveSection(props.section);

		if (props.section === 'settings') {
			navigate(activeWorkspaceUid ? `/w/${activeWorkspaceUid}/settings/profile` : '/profile');
			return;
		}

		if (props.section === 'chats') {
			navigate(activeWorkspaceUid ? `/w/${activeWorkspaceUid}/chats` : '/');
			return;
		}

		if (props.section === 'contacts') {
			navigate(activeWorkspaceUid ? `/w/${activeWorkspaceUid}/contacts` : '/');
			return;
		}

		if (props.section === 'integrations') {
			navigate(activeWorkspaceUid ? `/w/${activeWorkspaceUid}/integrations` : '/');
			return;
		}

		if (isProfilePage) navigate(activeWorkspaceUid ? `/w/${activeWorkspaceUid}` : '/');
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

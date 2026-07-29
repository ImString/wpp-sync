import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useInterfaceStore } from '@/components/interface';

import { useChatStore } from '../store';

export const useChatShortcuts = () => {
	const navigate = useNavigate();
	const { chatId, uid } = useParams<{ chatId: string; uid: string }>();
	const contactPanelOpen = useChatStore(state => state.contactPanelOpen);
	const sidebarOpen = useChatStore(state => state.sidebarOpen);
	const closeContactPanel = useChatStore(state => state.closeContactPanel);
	const closeSidebar = useChatStore(state => state.closeSidebar);
	const toggleTheme = useInterfaceStore(state => state.toggleTheme);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();

				if (sidebarOpen || contactPanelOpen) {
					if (sidebarOpen) closeSidebar();
					if (contactPanelOpen) closeContactPanel();
					return;
				}

				if (uid && chatId) navigate(`/w/${uid}/chats`);
			}

			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				document.querySelector<HTMLInputElement>('[data-global-search]')?.focus();
			}

			if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'l') {
				event.preventDefault();
				toggleTheme();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [chatId, closeContactPanel, closeSidebar, contactPanelOpen, navigate, sidebarOpen, toggleTheme, uid]);
};

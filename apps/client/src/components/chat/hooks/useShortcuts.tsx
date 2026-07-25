import { useEffect } from 'react';

import { useInterfaceStore } from '@/components/interface';

import { useChatStore } from '../store';

export const useChatShortcuts = () => {
	const closeContactPanel = useChatStore(state => state.closeContactPanel);
	const closeSidebar = useChatStore(state => state.closeSidebar);
	const toggleTheme = useInterfaceStore(state => state.toggleTheme);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				closeSidebar();
				closeContactPanel();
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
	}, [closeContactPanel, closeSidebar, toggleTheme]);
};

import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/buttons';

import { useChatStore } from '../store';

export const SidebarBackdrop: React.FC = () => {
	const { sidebarOpen, closeSidebar } = useChatStore(
		useShallow(state => ({
			sidebarOpen: state.sidebarOpen,
			closeSidebar: state.closeSidebar
		}))
	);

	return (
		<Button
			theme="unstyled"
			type="button"
			aria-label="Fechar menu"
			tabIndex={-1}
			className={twMerge(
				'sidebar-backdrop fixed inset-0 z-30 hidden bg-black/60 opacity-0 transition-opacity',
				sidebarOpen && 'is-open'
			)}
			onClick={closeSidebar}
		/>
	);
};

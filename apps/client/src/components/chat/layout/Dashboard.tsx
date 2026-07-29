import { Outlet } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';

import { ConversationPanel } from '../conversation';
import { useChatStore } from '../store';

export const ChatDashboard: React.FC = () => {
	const { contactPanelOpen, mobileView } = useChatStore(
		useShallow(state => ({
			contactPanelOpen: state.contactPanelOpen,
			mobileView: state.mobileView
		}))
	);

	return (
		<div
			className={twMerge(
				'relative min-h-0 overflow-hidden mobile:grid mobile:grid-cols-[minmax(270px,320px)_minmax(400px,1fr)] wide:grid-cols-[minmax(270px,330px)_minmax(420px,1fr)_minmax(0px,0px)] wide:transition-[grid-template-columns] wide:duration-300 wide:ease-[cubic-bezier(.22,1,.36,1)]',
				contactPanelOpen &&
					'wide:grid-cols-[minmax(270px,330px)_minmax(420px,1fr)_minmax(260px,320px)]',
				`dashboard-mobile-${mobileView}`
			)}>
			<ConversationPanel />
			<Outlet />
		</div>
	);
};

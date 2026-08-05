import { lazy, Suspense } from 'react';

import { MobileNavigation } from '../mobile';
import { useChatStore } from '../store';
import { Topbar } from '../topbar';
import { ChatDashboard } from './Dashboard';

const NewConversationModal = lazy(() =>
	import('../conversation/NewConversationModal').then(module => ({ default: module.NewConversationModal }))
);

export const ChatWorkspace: React.FC = () => {
	const newConversationOpen = useChatStore(state => state.newConversationOpen);
	const openNewConversation = useChatStore(state => state.openNewConversation);

	return (
		<main className="relative grid min-h-0 grid-rows-[62px_minmax(0,1fr)_72px] overflow-hidden bg-white dark:bg-[#0e181e] mobile:grid-rows-[72px_minmax(0,1fr)] drawer:rounded-r-2xl drawer:border drawer:border-l-0 drawer:border-slate-200 drawer:shadow-app dark:drawer:border-[#223138]">
			<Topbar />
			<ChatDashboard />
			<MobileNavigation onPrimaryAction={openNewConversation} primaryActionLabel="Nova conversa" />
			{newConversationOpen && (
				<Suspense fallback={null}>
					<NewConversationModal />
				</Suspense>
			)}
		</main>
	);
};

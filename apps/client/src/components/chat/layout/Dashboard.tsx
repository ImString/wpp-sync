import { twMerge } from 'tailwind-merge';

import { ContactPanel } from '../contact';
import { ConversationPanel } from '../conversation';
import { ChatPanel } from '../messages';
import { useChatStore } from '../store';

export const ChatDashboard: React.FC = () => {
	const mobileView = useChatStore(state => state.mobileView);

	return (
		<div
			className={twMerge(
				'relative min-h-0 overflow-hidden mobile:grid mobile:grid-cols-[minmax(270px,320px)_minmax(400px,1fr)] wide:grid-cols-[minmax(270px,330px)_minmax(420px,1fr)_minmax(260px,320px)]',
				`dashboard-mobile-${mobileView}`
			)}>
			<ConversationPanel />
			<ChatPanel />
			<ContactPanel />
		</div>
	);
};

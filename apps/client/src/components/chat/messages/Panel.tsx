import { MessageComposer } from './Composer';
import { ChatHeader } from './Header';
import { MessageList } from './List';

export const ChatPanel: React.FC = () => {
	return (
		<section className="chat-panel mobile-screen grid min-h-0 grid-rows-[74px_minmax(0,1fr)_auto] overflow-hidden border-r border-slate-200 bg-white dark:border-[#223138] dark:bg-[#0e181e]">
			<ChatHeader />
			<MessageList />
			<MessageComposer />
		</section>
	);
};

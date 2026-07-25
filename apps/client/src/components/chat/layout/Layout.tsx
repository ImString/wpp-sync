import { useChatPage, useChatShortcuts } from '../hooks';
import { Sidebar, SidebarBackdrop } from '../sidebar';
import { ChatWorkspace } from './Workspace';

export const ChatLayout: React.FC = () => {
	useChatPage();
	useChatShortcuts();

	return (
		<div className="grid h-dvh grid-cols-1 p-0 drawer:grid-cols-[220px_minmax(0,1fr)] drawer:p-4.5">
			<SidebarBackdrop />
			<Sidebar />
			<ChatWorkspace />
		</div>
	);
};

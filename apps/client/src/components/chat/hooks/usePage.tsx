import { useEffect } from 'react';

import { useWorkspaceStore } from '@/stores';

export const useChatPage = () => {
	const workspaceName = useWorkspaceStore(
		state => state.workspaces.find(workspace => workspace.slug === state.activeWorkspaceSlug)?.name
	);

	useEffect(() => {
		const previousTitle = document.title;
		document.title = workspaceName ? `Conversas · ${workspaceName} — WppSync` : 'Conversas — WppSync';
		document.body.classList.add('chat-page');

		return () => {
			document.title = previousTitle;
			document.body.classList.remove('chat-page');
		};
	}, [workspaceName]);
};

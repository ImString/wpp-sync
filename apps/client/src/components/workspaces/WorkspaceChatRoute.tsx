import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { ChatLayout } from '@/components/chat';
import { useWorkspaceStore } from '@/stores';

export const WorkspaceChatRoute: React.FC = () => {
	const { slug } = useParams<{ slug: string }>();
	const workspace = useWorkspaceStore(state => state.workspaces.find(item => item.slug === slug));
	const setActiveWorkspace = useWorkspaceStore(state => state.setActiveWorkspace);

	useEffect(() => {
		if (workspace) setActiveWorkspace(workspace.slug);
	}, [setActiveWorkspace, workspace]);

	if (!workspace) return <Navigate to="/" replace state={{ workspaceNotFound: true }} />;

	return <ChatLayout />;
};

import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { Loading } from '@/components/loading';
import { RouteManagerRoute } from '@/components/routerManager';
import { useWorkspaceStore } from '@/stores';

export const WorkspaceChatRoute: React.FC = () => {
	const { uid } = useParams<{ uid: string }>();

	const location = useLocation();

	const { workspace, getWorkspace, setActiveWorkspace } = useWorkspaceStore(
		useShallow(state => ({
			workspace: state.workspaces.find(item => item.uid === uid),
			getWorkspace: state.getWorkspace,
			setActiveWorkspace: state.setActiveWorkspace
		}))
	);
	const [isLoading, setIsLoading] = useState(!workspace);
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		if (!uid) {
			setHasError(true);
			setIsLoading(false);
			return;
		}

		if (workspace) {
			setActiveWorkspace(uid);
			setHasError(false);
			setIsLoading(false);
			return;
		}

		const controller = new AbortController();
		setIsLoading(true);
		setHasError(false);

		void getWorkspace(uid, controller.signal)
			.catch(() => {
				if (!controller.signal.aborted) setHasError(true);
			})
			.finally(() => {
				if (!controller.signal.aborted) setIsLoading(false);
			});

		return () => controller.abort();
	}, [getWorkspace, setActiveWorkspace, uid, workspace]);

	if (hasError) return <Navigate to="/" replace state={{ workspaceNotFound: true }} />;

	if (isLoading || !workspace) return <Loading label="Carregando área de trabalho..." />;

	return (
		<RouteManagerRoute
			title={
				location.pathname.includes('/integrations')
					? 'Integrações'
					: location.pathname.includes('/contacts/stages')
						? 'Etapas de relacionamento'
						: location.pathname.includes('/contacts')
							? 'Contatos'
							: 'Conversas'
			}
			context={workspace.name}
			bodyClassName="chat-page">
			<Outlet />
		</RouteManagerRoute>
	);
};

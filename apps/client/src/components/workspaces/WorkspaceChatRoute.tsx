import { useEffect, useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';

import { Loading } from '@/components/loading';
import { useWorkspaceStore } from '@/stores';

export const WorkspaceChatRoute: React.FC = () => {
	const { uid } = useParams<{ uid: string }>();
	const workspace = useWorkspaceStore(state => state.workspaces.find(item => item.uid === uid));
	const getWorkspace = useWorkspaceStore(state => state.getWorkspace);
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		if (!uid) {
			setHasError(true);
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
	}, [getWorkspace, uid]);

	if (isLoading) return <Loading label="Carregando área de trabalho..." />;

	if (hasError || !workspace) return <Navigate to="/" replace state={{ workspaceNotFound: true }} />;

	return <Outlet />;
};

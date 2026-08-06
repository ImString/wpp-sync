import { useEffect, type PropsWithChildren } from 'react';
import { useParams } from 'react-router-dom';

import { useSocketStore } from '@/stores';

export const WorkspaceSocketMiddleware: React.FC<PropsWithChildren> = props => {
	const { uid } = useParams<{ uid: string }>();
	const joinWorkspace = useSocketStore(state => state.joinWorkspace);
	const leaveWorkspace = useSocketStore(state => state.leaveWorkspace);

	useEffect(() => {
		if (!uid) return;

		joinWorkspace(uid);

		return () => leaveWorkspace(uid);
	}, [uid, joinWorkspace, leaveWorkspace]);

	return props.children;
};

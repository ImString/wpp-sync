import { useEffect, type PropsWithChildren } from 'react';

import { useAuthenticationStore, useSocketStore } from '@/stores';

export const SocketProvider: React.FC<PropsWithChildren> = props => {
	const authenticationStatus = useAuthenticationStore(state => state.status);
	const authToken = useAuthenticationStore(state => state.authToken);
	const connect = useSocketStore(state => state.connect);
	const disconnect = useSocketStore(state => state.disconnect);

	useEffect(() => {
		if (authenticationStatus !== 'authenticated' || !authToken) {
			disconnect();
			return;
		}

		connect(authToken);
	}, [authenticationStatus, authToken, connect, disconnect]);

	useEffect(() => () => disconnect(), [disconnect]);

	return props.children;
};

import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { Loading } from '@/components/loading';
import { useAuthenticationStore } from '@/stores';

interface AuthenticationMiddlewareProps extends PropsWithChildren {
	onlyLogged?: boolean;
	onlyNotLogged?: boolean;
}

export const AuthenticationMiddleware: React.FC<AuthenticationMiddlewareProps> = props => {
	const location = useLocation();
	const status = useAuthenticationStore(state => state.status);
	const currentUser = useAuthenticationStore(state => state.currentUser);
	const isLogged = status === 'authenticated' && Boolean(currentUser);

	if (status === 'idle' || status === 'checking') return <Loading />;

	if (props.onlyLogged && !isLogged) {
		const from = `${location.pathname}${location.search}${location.hash}`;
		return <Navigate to="/auth/login" replace state={{ from }} />;
	}

	if (props.onlyNotLogged && isLogged) return <Navigate to="/" replace />;

	return props.children;
};

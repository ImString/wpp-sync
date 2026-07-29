import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { Loading } from '@/components/loading';
import { useAuthenticationStore } from '@/stores';

interface AuthenticationMiddlewareProps extends PropsWithChildren {
	onlyLogged?: boolean;
	onlyNotLogged?: boolean;
}

export const AuthenticationMiddleware: React.FC<AuthenticationMiddlewareProps> = props => {
	const location = useLocation();
	const { status, currentUser } = useAuthenticationStore(
		useShallow(state => ({
			status: state.status,
			currentUser: state.currentUser
		}))
	);
	const isLogged = status === 'authenticated' && Boolean(currentUser);

	if (status === 'idle' || status === 'checking') return <Loading />;

	if (props.onlyLogged && !isLogged) {
		const from = `${location.pathname}${location.search}${location.hash}`;
		return <Navigate to="/auth/login" replace state={{ from }} />;
	}

	if (props.onlyNotLogged && isLogged) return <Navigate to="/" replace />;

	return props.children;
};

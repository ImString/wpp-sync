import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AuthenticationMiddleware } from '@/components/middlewares';

import { AuthRoutes } from './routes/auth';

const WorkspacePage = lazy(() => import('@/components/workspaces').then(module => ({ default: module.WorkspacePage })));
const WorkspaceChatRoute = lazy(() =>
	import('@/components/workspaces').then(module => ({ default: module.WorkspaceChatRoute }))
);
const AccountPage = lazy(() => import('@/components/account').then(module => ({ default: module.AccountPage })));

export const RouteList = () => {
	return (
		<Routes>
			<Route
				path="/"
				element={
					<AuthenticationMiddleware onlyLogged>
						<WorkspacePage />
					</AuthenticationMiddleware>
				}
			/>
			<Route
				path="/w/:uid"
				element={
					<AuthenticationMiddleware onlyLogged>
						<WorkspaceChatRoute />
					</AuthenticationMiddleware>
				}
			/>
			<Route
				path="/w/:uid/my-profile"
				element={
					<AuthenticationMiddleware onlyLogged>
						<AccountPage />
					</AuthenticationMiddleware>
				}
			/>
			<Route
				path="/profile"
				element={
					<AuthenticationMiddleware onlyLogged>
						<AccountPage />
					</AuthenticationMiddleware>
				}
			/>
			<Route
				path="/auth/*"
				element={
					<AuthenticationMiddleware onlyNotLogged>
						<AuthRoutes />
					</AuthenticationMiddleware>
				}
			/>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
};

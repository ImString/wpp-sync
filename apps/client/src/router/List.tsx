import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AuthenticationMiddleware } from '@/components/middlewares';

import { AuthRoutes } from './routes/auth';

const WorkspacePage = lazy(() => import('@/components/workspaces').then(module => ({ default: module.WorkspacePage })));
const WorkspaceChatRoute = lazy(() =>
	import('@/components/workspaces').then(module => ({ default: module.WorkspaceChatRoute }))
);

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
				path="/w/:slug"
				element={
					<AuthenticationMiddleware onlyLogged>
						<WorkspaceChatRoute />
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

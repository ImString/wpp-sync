import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import { AuthenticationMiddleware } from '@/components/middlewares';

import { AuthRoutes } from './routes/auth';

const HomePage = lazy(() => import('@/pages').then(module => ({ default: module.HomePage })));

export const RouteList = () => {
	return (
		<Routes>
			<Route
				path="/"
				element={
					<AuthenticationMiddleware onlyLogged>
						<HomePage />
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
		</Routes>
	);
};

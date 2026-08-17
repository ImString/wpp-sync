import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { RouteManagerRoute } from '@/components/routerManager';

const LoginPage = lazy(() => import('@/pages/auth/login').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/register').then(module => ({ default: module.RegisterPage })));

export const AuthRoutes = () => {
	return (
		<Routes>
			<Route index element={<Navigate to="/auth/login" replace />} />
			<Route
				path="/login"
				element={
					<RouteManagerRoute title="Entrar" bodyClassName="auth-page">
						<LoginPage />
					</RouteManagerRoute>
				}
			/>
			<Route
				path="/register"
				element={
					<RouteManagerRoute title="Criar conta" bodyClassName="auth-page">
						<RegisterPage />
					</RouteManagerRoute>
				}
			/>
			<Route path="/google/callback" />
			<Route path="*" element={<Navigate to="/auth/login" replace />} />
		</Routes>
	);
};

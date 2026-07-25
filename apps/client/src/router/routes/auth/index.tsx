import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const LoginPage = lazy(() => import('@/pages/auth/login').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/register').then(module => ({ default: module.RegisterPage })));

export const AuthRoutes = () => {
	return (
		<Routes>
			<Route index element={<Navigate to="/auth/login" replace />} />
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route path="*" element={<Navigate to="/auth/login" replace />} />
		</Routes>
	);
};

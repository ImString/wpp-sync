import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import { AuthRoutes } from './routes/auth';

const HomePage = lazy(() => import('@/pages').then(module => ({ default: module.HomePage })));

export const RouteList = () => {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/auth/*" element={<AuthRoutes />} />
		</Routes>
	);
};

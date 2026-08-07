import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';

import { Interface } from '@/components/interface';
import { Loading } from '@/components/loading';
import { AuthenticationProvider, SocketProvider } from '@/components/middlewares';
import router from '@/router';

export const App: React.FC = () => {
	const isWidgetRoute = window.location.pathname.replace(/\/+$/, '') === '/widget';
	const application = (
		<div className="min-h-screen w-full">
			<Suspense fallback={<Loading label="Carregando página..." />}>
				<RouterProvider router={router} />
			</Suspense>
		</div>
	);

	if (isWidgetRoute) return application;

	return (
		<Interface>
			<AuthenticationProvider>
				<SocketProvider>
					{application}
				</SocketProvider>
			</AuthenticationProvider>
		</Interface>
	);
};

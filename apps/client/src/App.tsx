import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';

import { Interface } from '@/components/interface';
import { Loading } from '@/components/loading';
import { AuthenticationProvider } from '@/components/middlewares';
import router from '@/router';

export const App: React.FC = () => {
	return (
		<Interface>
			<AuthenticationProvider>
				<div className="min-h-screen w-full">
					<Suspense fallback={<Loading label="Carregando página..." />}>
						<RouterProvider router={router} />
					</Suspense>
				</div>
			</AuthenticationProvider>
		</Interface>
	);
};

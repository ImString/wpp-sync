import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';

import { Interface } from '@/components/interface';
import router from '@/router';

export const App: React.FC = () => {
	return (
		<Interface>
			<div className="min-h-screen w-full">
				<Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
					<RouterProvider router={router} />
				</Suspense>
			</div>
		</Interface>
	);
};

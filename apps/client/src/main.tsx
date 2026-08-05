import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'react-phone-input-2/lib/plain.css';

import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
	throw new Error('Root element not found');
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>
);

import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';

import { useInterfaceStore } from './store';

export const Interface: React.FC<PropsWithChildren> = props => {
	const theme = useInterfaceStore(state => state.theme);

	useEffect(() => {
		document.documentElement.classList.add(theme);
		document.documentElement.classList.remove(theme === 'light' ? 'dark' : 'light');
	}, [theme]);

	return props.children;
};

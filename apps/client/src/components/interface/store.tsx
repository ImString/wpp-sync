import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { InterfaceStore, ThemeMode } from './types';

const getPreferredTheme = (): ThemeMode => {
	if (typeof window === 'undefined') return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useInterfaceStore = create<InterfaceStore>()(
	persist(
		set => ({
			theme: getPreferredTheme(),
			setTheme: theme => set({ theme }),
			toggleTheme: () => set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' }))
		}),
		{
			name: 'ThemeMode',
			storage: createJSONStorage(() => localStorage),
			partialize: state => ({ theme: state.theme })
		}
	)
);

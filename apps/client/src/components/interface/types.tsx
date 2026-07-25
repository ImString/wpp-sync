export type ThemeMode = 'light' | 'dark';

export const themeModes: ThemeMode[] = ['light', 'dark'];

export interface InterfaceStore {
	theme: ThemeMode;
	setTheme: (theme: ThemeMode) => void;
	toggleTheme: () => void;
}

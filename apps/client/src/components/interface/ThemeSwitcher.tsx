import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

import { Button } from '@/components/buttons';

import { useInterfaceStore } from './store';

interface ThemeSwitcherProps {
	className?: string;
	iconClassName?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = props => {
	const theme = useInterfaceStore(state => state.theme);
	const toggleTheme = useInterfaceStore(state => state.toggleTheme);
	const nextThemeLabel = theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro';

	return (
		<Button
			theme="ghost"
			className={twMerge('rounded-full p-2 text-2xl', props.className)}
			type="button"
			onClick={toggleTheme}
			aria-label={nextThemeLabel}
			aria-pressed={theme === 'dark'}>
			{theme === 'light' ? (
				<MdLightMode className={props.iconClassName} aria-hidden="true" />
			) : (
				<MdDarkMode className={props.iconClassName} aria-hidden="true" />
			)}
		</Button>
	);
};

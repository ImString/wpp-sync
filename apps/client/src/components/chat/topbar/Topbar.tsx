import { MdMenu, MdNotificationsNone, MdSync } from 'react-icons/md';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/buttons';
import { SearchInput } from '@/components/inputs';
import { ThemeSwitcher } from '@/components/interface';

import { useChatStore } from '../store';
import { ConnectionStatus } from './ConnectionStatus';

interface TopbarProps {
	searchValue?: string;
	searchPlaceholder?: string;
	onSearchChange?: (value: string) => void;
}

export const Topbar: React.FC<TopbarProps> = props => {
	const { openSidebar, search, setSearch } = useChatStore(
		useShallow(state => ({
			openSidebar: state.openSidebar,
			search: state.search,
			setSearch: state.setSearch
		}))
	);
	const searchValue = props.searchValue ?? search;
	const searchPlaceholder = props.searchPlaceholder || 'Buscar conversas...';

	return (
		<header className="flex min-w-0 items-center justify-between gap-4 border-b border-slate-200 px-2.5 dark:border-[#223138] mobile:px-4">
			<div className="flex min-w-0 flex-1 items-center gap-2.5">
				<Button
					theme="ghost"
					type="button"
					aria-label="Abrir menu"
					className="icon-button drawer:hidden"
					onClick={openSidebar}>
					<MdMenu aria-hidden="true" />
				</Button>

				<SearchInput
					data-global-search
					value={searchValue}
					onChange={event =>
						props.onSearchChange ? props.onSearchChange(event.target.value) : setSearch(event.target.value)
					}
					placeholder={searchPlaceholder}
					autoComplete="off"
					shortcut="⌘ K"
					containerClassName="w-full max-w-[420px]"
					className="text-xs mobile:text-sm"
				/>
			</div>

			<div className="flex shrink-0 items-center gap-1">
				<ConnectionStatus />

				<Button theme="ghost" type="button" aria-label="Sincronizar" className="icon-button hidden mobile:grid">
					<MdSync aria-hidden="true" />
				</Button>

				<Button
					theme="ghost"
					type="button"
					aria-label="Notificações"
					className="icon-button relative hidden mobile:grid">
					<MdNotificationsNone aria-hidden="true" />
					<span className="absolute right-0.5 top-0.5 grid min-w-4.25 place-items-center rounded-full border-2 border-white bg-brand-600 px-1 text-[9px] font-bold text-white dark:border-[#0e181e]">
						3
					</span>
				</Button>

				<ThemeSwitcher className="size-10 min-h-10 rounded-xl p-0 text-xl" />
			</div>
		</header>
	);
};

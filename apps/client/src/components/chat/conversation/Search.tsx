import { useShallow } from 'zustand/react/shallow';

import { SearchInput } from '@/components/inputs';

import { useChatStore } from '../store';

export const ConversationSearch: React.FC = () => {
	const { search, setSearch } = useChatStore(
		useShallow(state => ({
			search: state.search,
			setSearch: state.setSearch
		}))
	);

	return (
		<SearchInput
			value={search}
			onChange={event => setSearch(event.target.value)}
			placeholder="Buscar conversas..."
			autoComplete="off"
			containerClassName="mx-3.5 h-[42px] shrink-0"
		/>
	);
};

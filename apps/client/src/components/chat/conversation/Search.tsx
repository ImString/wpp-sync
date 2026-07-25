import { SearchInput } from '@/components/inputs';

import { useChatStore } from '../store';

export const ConversationSearch: React.FC = () => {
	const search = useChatStore(state => state.search);
	const setSearch = useChatStore(state => state.setSearch);

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

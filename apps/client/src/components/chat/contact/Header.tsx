import { MdArrowBack } from 'react-icons/md';

import { Button } from '@/components/buttons';

import { useChatStore } from '../store';

export const ContactHeader: React.FC = () => {
	const closeContactPanel = useChatStore(state => state.closeContactPanel);

	return (
		<header className="flex min-h-18.5 items-center gap-1.5 border-b border-slate-200 px-4.5 dark:border-[#223138]">
			<Button
				theme="ghost"
				type="button"
				aria-label="Voltar para conversa"
				className="icon-button wide:hidden"
				onClick={closeContactPanel}>
				<MdArrowBack aria-hidden="true" />
			</Button>
			<h2 className="text-sm font-semibold">Dados do contato</h2>
		</header>
	);
};

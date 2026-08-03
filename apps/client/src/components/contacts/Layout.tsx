import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { MobileNavigation } from '@/components/chat/mobile';
import { Sidebar, SidebarBackdrop } from '@/components/chat/sidebar';
import { useChatStore } from '@/components/chat/store';
import { Topbar } from '@/components/chat/topbar';

export interface ContactsLayoutContext {
	search: string;
	createRequest: number;
}

export const ContactsLayout: React.FC = () => {
	const [search, setSearch] = useState('');
	const [createRequest, setCreateRequest] = useState(0);
	const location = useLocation();
	const setActiveSection = useChatStore(state => state.setActiveSection);
	const isStagesPage = location.pathname.includes('/contacts/stages');

	useEffect(() => {
		setActiveSection('contacts');
	}, [setActiveSection]);

	useEffect(() => {
		setSearch('');
	}, [isStagesPage]);

	return (
		<div className="grid h-dvh grid-cols-1 p-0 drawer:grid-cols-[220px_minmax(0,1fr)] drawer:p-4.5">
			<SidebarBackdrop />
			<Sidebar />
			<main className="relative grid min-h-0 grid-rows-[62px_minmax(0,1fr)_72px] overflow-hidden bg-white dark:bg-[#0e181e] mobile:grid-rows-[72px_minmax(0,1fr)] drawer:rounded-r-2xl drawer:border drawer:border-l-0 drawer:border-slate-200 drawer:shadow-app dark:drawer:border-[#223138]">
				<Topbar
					searchValue={search}
					onSearchChange={setSearch}
					searchPlaceholder={
						isStagesPage
							? 'Buscar etapas por nome, descrição ou cor...'
							: 'Buscar por nome, etapa, telefone...'
					}
				/>
				<Outlet context={{ search, createRequest } satisfies ContactsLayoutContext} />
				<MobileNavigation
					activeSection="contacts"
					primaryActionLabel={isStagesPage ? 'Nova etapa' : 'Novo contato'}
					onPrimaryAction={() => setCreateRequest(request => request + 1)}
				/>
			</main>
		</div>
	);
};

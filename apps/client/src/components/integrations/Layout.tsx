import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { MobileNavigation } from '@/components/chat/mobile';
import { Sidebar, SidebarBackdrop } from '@/components/chat/sidebar';
import { useChatStore } from '@/components/chat/store';
import { Topbar } from '@/components/chat/topbar';

export interface IntegrationsLayoutContext {
	search: string;
	createRequest: number;
}

export const IntegrationsLayout: React.FC = () => {
	const [search, setSearch] = useState('');
	const [createRequest, setCreateRequest] = useState(0);
	const setActiveSection = useChatStore(state => state.setActiveSection);

	useEffect(() => {
		setActiveSection('integrations');
	}, [setActiveSection]);

	return (
		<div className="grid h-dvh grid-cols-1 p-0 drawer:grid-cols-[220px_minmax(0,1fr)] drawer:p-4.5">
			<SidebarBackdrop />
			<Sidebar />
			<main className="relative grid min-h-0 grid-rows-[62px_minmax(0,1fr)_72px] overflow-hidden bg-white dark:bg-[#0e181e] mobile:grid-rows-[72px_minmax(0,1fr)] drawer:rounded-r-2xl drawer:border drawer:border-l-0 drawer:border-slate-200 drawer:shadow-app dark:drawer:border-[#223138]">
				<Topbar
					searchValue={search}
					onSearchChange={setSearch}
					searchPlaceholder="Buscar integração por nome..."
				/>
				<Outlet context={{ search, createRequest } satisfies IntegrationsLayoutContext} />
				<MobileNavigation
					activeSection="integrations"
					primaryActionLabel="Nova integração"
					onPrimaryAction={() => setCreateRequest(request => request + 1)}
				/>
			</main>
		</div>
	);
};

import { useEffect, useState } from 'react';
import { MdAutorenew, MdErrorOutline } from 'react-icons/md';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/buttons';
import { MobileNavigation } from '@/components/chat/mobile';
import { Sidebar, SidebarBackdrop } from '@/components/chat/sidebar';
import { useChatStore } from '@/components/chat/store';
import { Topbar } from '@/components/chat/topbar';

import { useContactsStore } from './store';

export interface ContactsLayoutContext {
	search: string;
	createRequest: number;
}

export const ContactsLayout: React.FC = () => {
	const [search, setSearch] = useState('');
	const [createRequest, setCreateRequest] = useState(0);
	const location = useLocation();
	const { uid } = useParams<{ uid: string }>();
	const setActiveSection = useChatStore(state => state.setActiveSection);
	const { contacts, stages, loadStatus, error, loadData } = useContactsStore(
		useShallow(state => ({
			contacts: state.contacts,
			stages: state.stages,
			loadStatus: state.loadStatus,
			error: state.error,
			loadData: state.loadData
		}))
	);
	const isStagesPage = location.pathname.includes('/contacts/stages');

	useEffect(() => {
		setActiveSection('contacts');
	}, [setActiveSection]);

	useEffect(() => {
		setSearch('');
	}, [isStagesPage]);

	useEffect(() => {
		if (!uid) return;

		const controller = new AbortController();
		void loadData(uid, controller.signal).catch(() => undefined);
		return () => controller.abort();
	}, [loadData, uid]);

	const hasData = contacts.length > 0 || stages.length > 0;
	const content =
		loadStatus === 'loading' && !hasData ? (
			<div className="grid min-h-0 place-items-center bg-slate-50 p-6 text-center dark:bg-[#0b151a]">
				<div>
					<MdAutorenew className="mx-auto size-7 animate-spin text-brand-500" aria-hidden="true" />
					<p className="mt-3 text-xs font-semibold">Carregando contatos...</p>
				</div>
			</div>
		) : loadStatus === 'error' && !hasData ? (
			<div className="grid min-h-0 place-items-center bg-slate-50 p-6 text-center dark:bg-[#0b151a]">
				<div className="max-w-80">
					<MdErrorOutline className="mx-auto size-8 text-red-500" aria-hidden="true" />
					<h2 className="mt-3 text-sm font-semibold">Não foi possível carregar esta área</h2>
					<p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{error}</p>
					<Button
						type="button"
						className="mt-4"
						onClick={() => uid && void loadData(uid, undefined, true).catch(() => undefined)}>
						Tentar novamente
					</Button>
				</div>
			</div>
		) : (
			<Outlet context={{ search, createRequest } satisfies ContactsLayoutContext} />
		);

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
				{content}
				<MobileNavigation
					activeSection="contacts"
					primaryActionLabel={isStagesPage ? 'Nova etapa' : 'Novo contato'}
					onPrimaryAction={() => setCreateRequest(request => request + 1)}
				/>
			</main>
		</div>
	);
};

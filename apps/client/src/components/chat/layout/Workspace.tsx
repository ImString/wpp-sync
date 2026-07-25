import { MobileNavigation } from '../mobile';
import { Topbar } from '../topbar';
import { ChatDashboard } from './Dashboard';

export const ChatWorkspace: React.FC = () => {
	return (
		<main className="relative grid min-h-0 grid-rows-[62px_minmax(0,1fr)_72px] overflow-hidden bg-white dark:bg-[#0e181e] mobile:grid-rows-[72px_minmax(0,1fr)] drawer:rounded-r-2xl drawer:border drawer:border-l-0 drawer:border-slate-200 drawer:shadow-app dark:drawer:border-[#223138]">
			<Topbar />
			<ChatDashboard />
			<MobileNavigation />
		</main>
	);
};

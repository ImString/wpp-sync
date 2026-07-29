import { MdAdd, MdCampaign, MdChatBubbleOutline, MdMenu, MdOutlineContacts } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/buttons';

import { useChatStore } from '../store';
import { MobileNavigationItem } from './NavigationItem';

export const MobileNavigation: React.FC = () => {
	const navigate = useNavigate();
	const { uid } = useParams<{ uid: string }>();
	const openSidebar = useChatStore(state => state.openSidebar);

	return (
		<nav
			className="relative z-20 grid grid-cols-5 items-center border-t border-slate-200 bg-white px-2 py-1 dark:border-[#223138] dark:bg-[#0e181e] mobile:hidden"
			aria-label="Navegação mobile">
			<MobileNavigationItem
				icon={MdChatBubbleOutline}
				label="Conversas"
				active
				onClick={() => navigate(uid ? `/w/${uid}/chats` : '/')}
			/>
			<MobileNavigationItem icon={MdOutlineContacts} label="Contatos" />
			<Button
				type="button"
				aria-label="Nova conversa"
				className="mx-auto size-12 min-h-12 rounded-full p-0 shadow-[0_8px_20px_rgba(37,211,102,.3)]">
				<MdAdd className="size-6" aria-hidden="true" />
			</Button>
			<MobileNavigationItem icon={MdCampaign} label="Campanhas" />
			<MobileNavigationItem icon={MdMenu} label="Mais" onClick={openSidebar} />
		</nav>
	);
};

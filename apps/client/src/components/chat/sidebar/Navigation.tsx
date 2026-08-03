import {
	MdAccountTree,
	MdBarChart,
	MdCampaign,
	MdChatBubbleOutline,
	MdGridView,
	MdOutlineContacts,
	MdSettings
} from 'react-icons/md';

import { NavigationItem } from './NavigationItem';

export const SidebarNavigation: React.FC = () => {
	return (
		<nav className="flex flex-1 flex-col gap-1.5 px-3 py-5">
			<NavigationItem icon={MdChatBubbleOutline} label="Conversas" section="chats" />
			<NavigationItem icon={MdOutlineContacts} label="Contatos" section="contacts" />
			{/* <NavigationItem icon={MdCampaign} label="Campanhas" section="campaigns" />
			<NavigationItem icon={MdAccountTree} label="Automações" section="automations" />
			<NavigationItem icon={MdBarChart} label="Relatórios" section="reports" /> */}
			<NavigationItem icon={MdGridView} label="Integrações" section="integrations" />
			<NavigationItem icon={MdSettings} label="Configurações" section="settings" />
		</nav>
	);
};

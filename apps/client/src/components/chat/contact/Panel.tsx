import { twMerge } from 'tailwind-merge';

import { useChatStore } from '../store';
import { ContactActions } from './Actions';
import { ContactHeader } from './Header';
import { ContactInformation } from './Information';
import { ContactNotes } from './Notes';
import { ContactProfile } from './Profile';
import { ContactTags } from './Tags';

export const ContactPanel: React.FC = () => {
	const contactPanelOpen = useChatStore(state => state.contactPanelOpen);

	return (
		<aside
			className={twMerge(
				'contact-panel mobile-screen contact-slide-panel flex min-h-0 flex-col overflow-y-auto bg-white dark:bg-[#0e181e] scrollbar-thin',
				contactPanelOpen && 'is-open'
			)}>
			<ContactHeader />
			<ContactProfile />
			<ContactTags />
			<ContactNotes />
			<ContactInformation />
			<ContactActions />
		</aside>
	);
};

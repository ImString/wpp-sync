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
			id="contact-details-panel"
			aria-hidden={!contactPanelOpen}
			inert={!contactPanelOpen}
			className={twMerge(
				'contact-panel mobile-screen contact-slide-panel flex min-h-0 min-w-0 flex-col overflow-y-auto bg-white transition-[transform,opacity] duration-300 ease-[cubic-bezier(.22,1,.36,1)] wide:translate-x-12 wide:opacity-0 wide:pointer-events-none dark:bg-[#0e181e] scrollbar-thin',
				contactPanelOpen && 'is-open wide:translate-x-0 wide:opacity-100 wide:pointer-events-auto'
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

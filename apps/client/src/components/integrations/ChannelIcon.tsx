import type { IconType } from 'react-icons';
import { FaFacebookMessenger, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { MdEmail, MdLanguage, MdVerified } from 'react-icons/md';

import { channels } from './data';
import type { IntegrationType } from './types';

const iconByType: Record<IntegrationType, IconType> = {
	whatsapp: FaWhatsapp,
	// 'whatsapp-official': MdVerified,
	// instagram: FaInstagram,
	// messenger: FaFacebookMessenger,
	// email: MdEmail,
	website: MdLanguage
};

interface ChannelIconProps {
	type: IntegrationType;
	className?: string;
}

export const ChannelIcon: React.FC<ChannelIconProps> = props => {
	const channel = channels.find(item => item.type === props.type) || channels[0];
	const Icon = iconByType[props.type];

	return (
		<span
			className={`grid size-10 shrink-0 place-items-center rounded-xl text-xl ${props.className || ''}`}
			style={{ color: channel.accent, backgroundColor: channel.softAccent }}>
			<Icon aria-hidden="true" />
		</span>
	);
};

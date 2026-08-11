import type { IconType } from 'react-icons';
import { FaFacebookMessenger, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { MdLanguage } from 'react-icons/md';

import { channels } from './data';
import type { IntegrationType } from './types';

export type ChannelIconType = IntegrationType | 'INSTAGRAM' | 'MESSENGER';

const iconByType: Record<ChannelIconType, IconType> = {
	WHATSAPP: FaWhatsapp,
	WEB: MdLanguage,
	INSTAGRAM: FaInstagram,
	MESSENGER: FaFacebookMessenger
};

const additionalChannels = {
	INSTAGRAM: {
		name: 'Instagram',
		accent: '#e1306c',
		softAccent: 'rgba(225, 48, 108, .14)'
	},
	MESSENGER: {
		name: 'Messenger',
		accent: '#0084ff',
		softAccent: 'rgba(0, 132, 255, .14)'
	}
};

interface ChannelIconProps {
	type: ChannelIconType;
	badge?: boolean;
	className?: string;
}

export const ChannelIcon: React.FC<ChannelIconProps> = props => {
	const channel =
		channels.find(item => item.type === props.type) ||
		additionalChannels[props.type as keyof typeof additionalChannels] ||
		channels[0];
	const Icon = iconByType[props.type];

	return (
		<span
			className={`grid shrink-0 place-items-center ${
				props.badge
					? 'size-4.5 rounded-full text-xs text-white shadow-sm ring-2 ring-white dark:ring-[#0e181e]'
					: 'size-10 rounded-xl text-xl'
			} ${props.className || ''}`}
			role="img"
			aria-label={`Canal ${channel.name}`}
			title={channel.name}
			style={
				props.badge
					? { color: 'white', backgroundColor: channel.accent }
					: { color: channel.accent, backgroundColor: channel.softAccent }
			}>
			<Icon aria-hidden="true" />
		</span>
	);
};

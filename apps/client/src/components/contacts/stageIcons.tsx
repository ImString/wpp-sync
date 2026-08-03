import type { IconType } from 'react-icons';
import {
	MdAccessTime,
	MdArchive,
	MdAttachMoney,
	MdCalendarToday,
	MdChatBubbleOutline,
	MdCheckCircleOutline,
	MdEventAvailable,
	MdFavoriteBorder,
	MdFlag,
	MdGpsFixed,
	MdGroups,
	MdHourglassEmpty,
	MdLabelOutline,
	MdPauseCircleOutline,
	MdPersonOutline,
	MdPhone,
	MdRocketLaunch,
	MdShoppingCart,
	MdStarOutline,
	MdWarningAmber
} from 'react-icons/md';

import type { StageIconName } from './types';

export interface StageIconSuggestion {
	name: StageIconName;
	label: string;
	icon: IconType;
}

export const stageIconSuggestions: StageIconSuggestion[] = [
	{ name: 'label', label: 'Etiqueta', icon: MdLabelOutline },
	{ name: 'clock', label: 'Relógio', icon: MdAccessTime },
	{ name: 'hourglass', label: 'Ampulheta', icon: MdHourglassEmpty },
	{ name: 'person', label: 'Pessoa', icon: MdPersonOutline },
	{ name: 'group', label: 'Pessoas', icon: MdGroups },
	{ name: 'chat', label: 'Conversa', icon: MdChatBubbleOutline },
	{ name: 'phone', label: 'Telefone', icon: MdPhone },
	{ name: 'calendar', label: 'Calendário', icon: MdCalendarToday },
	{ name: 'event', label: 'Compromisso', icon: MdEventAvailable },
	{ name: 'check', label: 'Concluído', icon: MdCheckCircleOutline },
	{ name: 'star', label: 'Estrela', icon: MdStarOutline },
	{ name: 'heart', label: 'Coração', icon: MdFavoriteBorder },
	{ name: 'flag', label: 'Bandeira', icon: MdFlag },
	{ name: 'target', label: 'Objetivo', icon: MdGpsFixed },
	{ name: 'cart', label: 'Carrinho', icon: MdShoppingCart },
	{ name: 'money', label: 'Financeiro', icon: MdAttachMoney },
	{ name: 'rocket', label: 'Foguete', icon: MdRocketLaunch },
	{ name: 'pause', label: 'Pausado', icon: MdPauseCircleOutline },
	{ name: 'warning', label: 'Atenção', icon: MdWarningAmber },
	{ name: 'archive', label: 'Arquivado', icon: MdArchive }
];

const iconByName = Object.fromEntries(stageIconSuggestions.map(suggestion => [suggestion.name, suggestion.icon])) as Record<
	StageIconName,
	IconType
>;

interface StageIconProps {
	name?: StageIconName;
	className?: string;
}

export const StageIcon: React.FC<StageIconProps> = props => {
	const Icon = iconByName[props.name || 'label'] || MdLabelOutline;
	return <Icon className={props.className} aria-hidden="true" />;
};

import { stageIconNames, type StageIconName } from '@wppsync/shared/contact-stages';
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

export interface StageIconSuggestion {
	name: StageIconName;
	label: string;
	icon: IconType;
}

const stageIconDefinitions = {
	label: { label: 'Etiqueta', icon: MdLabelOutline },
	clock: { label: 'Relógio', icon: MdAccessTime },
	hourglass: { label: 'Ampulheta', icon: MdHourglassEmpty },
	person: { label: 'Pessoa', icon: MdPersonOutline },
	group: { label: 'Pessoas', icon: MdGroups },
	chat: { label: 'Conversa', icon: MdChatBubbleOutline },
	phone: { label: 'Telefone', icon: MdPhone },
	calendar: { label: 'Calendário', icon: MdCalendarToday },
	event: { label: 'Compromisso', icon: MdEventAvailable },
	check: { label: 'Concluído', icon: MdCheckCircleOutline },
	star: { label: 'Estrela', icon: MdStarOutline },
	heart: { label: 'Coração', icon: MdFavoriteBorder },
	flag: { label: 'Bandeira', icon: MdFlag },
	target: { label: 'Objetivo', icon: MdGpsFixed },
	cart: { label: 'Carrinho', icon: MdShoppingCart },
	money: { label: 'Financeiro', icon: MdAttachMoney },
	rocket: { label: 'Foguete', icon: MdRocketLaunch },
	pause: { label: 'Pausado', icon: MdPauseCircleOutline },
	warning: { label: 'Atenção', icon: MdWarningAmber },
	archive: { label: 'Arquivado', icon: MdArchive }
} satisfies Record<StageIconName, Omit<StageIconSuggestion, 'name'>>;

export const stageIconSuggestions: StageIconSuggestion[] = stageIconNames.map(name => ({
	name,
	...stageIconDefinitions[name]
}));

const iconByName = Object.fromEntries(
	stageIconSuggestions.map(suggestion => [suggestion.name, suggestion.icon])
) as Record<StageIconName, IconType>;

interface StageIconProps {
	name?: StageIconName;
	className?: string;
}

export const StageIcon: React.FC<StageIconProps> = props => {
	const Icon = iconByName[props.name || 'label'] || MdLabelOutline;
	return <Icon className={props.className} aria-hidden="true" />;
};

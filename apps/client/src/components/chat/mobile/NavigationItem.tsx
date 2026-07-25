import type { IconType } from 'react-icons';
import { twMerge } from 'tailwind-merge';

import { Button } from '@/components/buttons';

interface MobileNavigationItemProps {
	icon: IconType;
	label: string;
	onClick?: () => void;
	active?: boolean;
}

export const MobileNavigationItem: React.FC<MobileNavigationItemProps> = props => {
	return (
		<Button
			theme="unstyled"
			type="button"
			className={twMerge('mobile-nav-item', props.active && 'text-brand-600 dark:text-brand-500')}
			onClick={props.onClick}>
			<props.icon aria-hidden="true" />
			<span>{props.label}</span>
		</Button>
	);
};

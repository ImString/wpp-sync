import { twMerge } from 'tailwind-merge';

import { hexToRgba } from './stageColors';
import { StageIcon } from './stageIcons';
import type { RelationshipStage } from './types';

interface StatusBadgeProps {
	stage?: RelationshipStage;
	compact?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = props => {
	if (!props.stage) {
		return (
			<span
				className={twMerge(
					'inline-flex w-fit items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:bg-[#17262e] dark:text-slate-400',
					props.compact && 'px-2 py-0.5 text-[9px]'
				)}>
				Sem etapa
			</span>
		);
	}

	return (
		<span
			className={twMerge(
				'inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold',
				props.compact && 'px-2 py-0.5 text-[9px]'
			)}
			style={{ color: props.stage.color, backgroundColor: hexToRgba(props.stage.color, 0.12) }}>
			<StageIcon name={props.stage.icon} className={props.compact ? 'size-3' : 'size-3.5'} />
			{props.stage.name}
		</span>
	);
};

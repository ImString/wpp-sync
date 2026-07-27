import { MdArrowForward } from 'react-icons/md';

import type { Workspace } from '@/stores';

import { Image } from '../shared/Image';

interface WorkspaceCardProps {
	workspace: Workspace;
	onSelect: (workspace: Workspace) => void;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = props => {
	const { workspace } = props;

	return (
		<button
			className="group cursor-pointer grid min-h-28 w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 rounded-[17px] border border-(--workspace-border) bg-(--workspace-surface) p-3.75 text-left text-(--workspace-text) transition duration-150 hover:-translate-y-0.75 hover:border-[color-mix(in_srgb,var(--color-brand-500)_45%,var(--workspace-border))] hover:shadow-(--workspace-shadow-card) max-[680px]:min-h-26 max-[420px]:gap-2.5 max-[420px]:p-3.25"
			type="button"
			onClick={() => props.onSelect(workspace)}
			aria-label={`Entrar na área ${workspace.name}`}>
			<Image
				className="block size-13.5 shrink-0 rounded-[14px] object-cover max-[420px]:size-12.5"
				aria-hidden="true"
				src={workspace.avatarUrl || undefined}
				seed={workspace.name}
				collection="initials"
				size={256}
				scale={50}
				backgroundType="gradientLinear"
			/>

			<span className="flex min-w-0 flex-1 flex-col justify-center">
				<span className="flex min-w-0 items-start gap-2">
					<strong className="flex-1 truncate text-[13px] font-bold">{workspace.name}</strong>
				</span>

				<small className="mt-1.5 text-[10px] text-(--workspace-muted)">{workspace.slug}</small>
			</span>

			<span
				className="grid size-8 place-items-center rounded-full border border-(--workspace-border) bg-(--workspace-surface-muted) text-(--workspace-soft) transition duration-150 group-hover:translate-x-0.5 group-hover:border-brand-100 group-hover:bg-brand-50 group-hover:text-brand-700 dark:group-hover:border-[rgba(37,211,102,.18)] dark:group-hover:bg-[rgba(37,211,102,.11)] dark:group-hover:text-brand-400"
				aria-hidden="true">
				<MdArrowForward className="size-4" />
			</span>
		</button>
	);
};

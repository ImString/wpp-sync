import { useField } from 'formik';
import type { ReactNode } from 'react';
import { FaCheck } from 'react-icons/fa6';
import { twMerge } from 'tailwind-merge';

interface CheckboxInputProps {
	name: string;
	label: ReactNode;
	className?: string;
	indicatorClassName?: string;
}

export const CheckboxInput: React.FC<CheckboxInputProps> = props => {
	const [field, meta, helpers] = useField<boolean>({ name: props.name, type: 'checkbox' });
	const error = meta.touched ? meta.error : undefined;

	return (
		<div className={twMerge('grid gap-1.5', props.className)}>
			<label className="inline-flex cursor-pointer items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
				<input
					className="sr-only"
					type="checkbox"
					name={field.name}
					checked={field.value}
					onChange={event => helpers.setValue(event.target.checked)}
					onBlur={() => helpers.setTouched(true)}
				/>
				<span
					className={twMerge(
						'mt-px grid size-4 shrink-0 place-items-center rounded border border-slate-300 bg-white text-[9px] text-white transition dark:border-[#40505a] dark:bg-[#131f26]',
						field.value && 'border-brand-600 bg-brand-600 dark:border-brand-500 dark:bg-brand-600',
						props.indicatorClassName
					)}>
					{field.value && <FaCheck aria-hidden="true" />}
				</span>
				<span>{props.label}</span>
			</label>

			{error && (
				<p className="text-xs text-red-600 dark:text-red-400" aria-live="polite">
					{error}
				</p>
			)}
		</div>
	);
};

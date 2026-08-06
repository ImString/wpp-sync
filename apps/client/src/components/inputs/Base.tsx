import { useField } from 'formik';
import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export interface BaseInputChildProps<T = string> {
	value: T;
	setValue: (value: T) => void;
	setTouched: (touched: boolean) => void;
	error?: string;
}

interface BaseInputProps<T = string> {
	name: string;
	label?: string;
	description?: string;
	className?: string;
	labelClassName?: string;
	hideError?: boolean;
	children: (props: BaseInputChildProps<T>) => ReactNode;
}

export const BaseInput = <T,>(props: BaseInputProps<T>) => {
	const [field, meta, helpers] = useField<T>(props.name);
	const error = meta.touched ? meta.error : undefined;

	return (
		<div className={twMerge('grid w-full min-w-0 content-start gap-1.5', props.className)}>
			{props.label && (
				<label
					htmlFor={props.name}
					className={twMerge(
						'text-xs font-semibold text-slate-800 dark:text-slate-100',
						props.labelClassName
					)}>
					{props.label}
				</label>
			)}

			{props.children({
				value: field.value,
				setValue: helpers.setValue,
				setTouched: helpers.setTouched,
				error
			})}

			{error && !props.hideError && (
				<p className="text-xs text-red-600 dark:text-red-400" aria-live="polite">
					{error}
				</p>
			)}

			{props.description && !error && (
				<p className="text-xs text-slate-500 dark:text-slate-400">{props.description}</p>
			)}
		</div>
	);
};

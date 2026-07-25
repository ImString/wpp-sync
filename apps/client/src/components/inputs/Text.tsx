import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import type { IconType } from 'react-icons';
import { MdError, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

import { Button } from '@/components/buttons';

import { BaseInput } from './Base';

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> {
	name: string;
	label?: string;
	description?: string;
	icon?: IconType;
	className?: string;
	innerClassName?: string;
	labelClassName?: string;
}

export const TextInput: React.FC<TextInputProps> = props => {
	const [showingPassword, setShowingPassword] = useState(false);
	const {
		name,
		label,
		description,
		icon: Icon,
		className,
		innerClassName,
		labelClassName,
		type,
		...inputProps
	} = props;
	const inputType = type === 'password' && showingPassword ? 'text' : type;

	return (
		<BaseInput<string>
			name={name}
			label={label}
			description={description}
			className={className}
			labelClassName={labelClassName}>
			{baseInputProps => (
				<div
					className={twMerge(
						'relative flex h-12 w-full min-w-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-slate-500 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-[#223138] dark:bg-[#131f26] dark:text-slate-400 dark:focus-within:bg-[#0e181e]',
						baseInputProps.error && 'border-red-500 ring-4 ring-red-500/10',
						innerClassName
					)}>
					{Icon && <Icon className="ml-3.5 size-4.5 shrink-0" aria-hidden="true" />}

					<input
						{...inputProps}
						id={name}
						name={name}
						type={inputType}
						value={baseInputProps.value || ''}
						onChange={event => baseInputProps.setValue(event.target.value)}
						onBlur={() => baseInputProps.setTouched(true)}
						aria-invalid={baseInputProps.error ? true : undefined}
						className={twMerge(
							'h-full w-0 min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 focus:outline-none dark:text-slate-100',
							Icon && 'pl-2.5',
							type === 'password' && 'pr-1'
						)}
					/>

					{type === 'password' && (
						<Button
							theme="ghost"
							type="button"
							className="mr-1 size-10 min-h-10 shrink-0 rounded-lg p-0 text-lg"
							onClick={() => setShowingPassword(!showingPassword)}
							aria-label={showingPassword ? 'Ocultar senha' : 'Mostrar senha'}
							aria-pressed={showingPassword}>
							{showingPassword ? (
								<MdVisibilityOff aria-hidden="true" />
							) : (
								<MdVisibility aria-hidden="true" />
							)}
						</Button>
					)}

					{baseInputProps.error && type !== 'password' && (
						<MdError className="mr-3 size-5 shrink-0 text-red-500" aria-hidden="true" />
					)}
				</div>
			)}
		</BaseInput>
	);
};

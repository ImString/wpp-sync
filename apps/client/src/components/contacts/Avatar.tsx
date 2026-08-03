import { twMerge } from 'tailwind-merge';

const avatarThemes = [
	'from-emerald-500 to-teal-700',
	'from-sky-500 to-indigo-700',
	'from-amber-400 to-orange-600',
	'from-fuchsia-500 to-violet-700',
	'from-rose-500 to-red-700',
	'from-cyan-500 to-blue-700'
];

interface ContactAvatarProps {
	contactId: string;
	initials: string;
	className?: string;
}

export const ContactAvatar: React.FC<ContactAvatarProps> = props => {
	const themeIndex = [...props.contactId].reduce((total, character) => total + character.charCodeAt(0), 0);
	const theme = avatarThemes[themeIndex % avatarThemes.length];

	return (
		<span
			aria-hidden="true"
			className={twMerge(
				'inline-grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br text-[11px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0e181e]',
				theme,
				props.className
			)}>
			{props.initials}
		</span>
	);
};

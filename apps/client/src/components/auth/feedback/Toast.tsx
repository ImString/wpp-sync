import { twMerge } from 'tailwind-merge';

interface AuthToastProps {
	message: string;
	isVisible: boolean;
}

export const AuthToast: React.FC<AuthToastProps> = props => {
	return (
		<div className={twMerge('auth-toast', props.isVisible && 'is-visible')} role="status" aria-live="polite">
			<span className="auth-toast__icon" aria-hidden="true">
				✓
			</span>
			<span>{props.message || 'Tudo certo!'}</span>
		</div>
	);
};

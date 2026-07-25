import { twMerge } from 'tailwind-merge';

interface AuthToastProps {
	message: string;
	isVisible: boolean;
	variant?: 'success' | 'error';
}

export const AuthToast: React.FC<AuthToastProps> = props => {
	return (
		<div
			className={twMerge('auth-toast', props.isVisible && 'is-visible', props.variant === 'error' && 'is-error')}
			role="status"
			aria-live="polite">
			<span className="auth-toast__icon" aria-hidden="true">
				{props.variant === 'error' ? '!' : '✓'}
			</span>
			<span>{props.message || 'Tudo certo!'}</span>
		</div>
	);
};

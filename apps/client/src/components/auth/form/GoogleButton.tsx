import { FcGoogle } from 'react-icons/fc';

import { Button } from '@/components/buttons';

interface AuthGoogleButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
}

export const AuthGoogleButton: React.FC<AuthGoogleButtonProps> = props => {
	return (
		<Button theme="secondary" className="social-button" type="button" onClick={props.onClick}>
			<FcGoogle aria-hidden="true" />
			{props.children}
		</Button>
	);
};

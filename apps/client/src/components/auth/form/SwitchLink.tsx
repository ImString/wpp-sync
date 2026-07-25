import { Link } from 'react-router-dom';

interface AuthSwitchLinkProps {
	message: string;
	label: string;
	to: string;
}

export const AuthSwitchLink: React.FC<AuthSwitchLinkProps> = props => {
	return (
		<p className="auth-switch">
			{props.message} <Link to={props.to}>{props.label}</Link>
		</p>
	);
};

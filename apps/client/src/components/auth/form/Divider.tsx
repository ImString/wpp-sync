interface AuthDividerProps {
	children: React.ReactNode;
}

export const AuthDivider: React.FC<AuthDividerProps> = props => {
	return <div className="auth-divider">{props.children}</div>;
};

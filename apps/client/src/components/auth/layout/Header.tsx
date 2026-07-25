interface AuthHeaderProps {
	eyebrow: string;
	title: string;
	description: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = props => {
	return (
		<header className="auth-heading">
			<span className="auth-heading__eyebrow">{props.eyebrow}</span>
			<h2>{props.title}</h2>
			<p>{props.description}</p>
		</header>
	);
};

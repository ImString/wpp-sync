interface AuthFooterProps {
	label: string;
}

export const AuthFooter: React.FC<AuthFooterProps> = props => {
	return (
		<footer className="showcase-footer">
			<span>© 2026 WppSync</span>
			<span>
				<i className="animate-ping" /> {props.label}
			</span>
		</footer>
	);
};

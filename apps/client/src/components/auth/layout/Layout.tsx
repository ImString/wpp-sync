import { useAuthPage } from '../hooks';
import { AuthShowcase } from '../showcase';
import type { AuthLayoutProps } from '../types';
import { AuthContent } from './Content';

export const AuthLayout: React.FC<AuthLayoutProps> = props => {
	useAuthPage(props.pageTitle);

	return (
		<main className="auth-shell">
			<section className="auth-card" aria-label={props.ariaLabel}>
				<AuthShowcase content={props.showcase} />
				<AuthContent eyebrow={props.eyebrow} title={props.title} description={props.description}>
					{props.children}
				</AuthContent>
			</section>
		</main>
	);
};

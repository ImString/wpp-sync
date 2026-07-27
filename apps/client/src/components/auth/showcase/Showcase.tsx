import { AuthBrand } from '../brand';
import type { AuthShowcaseContent } from '../types';
import { AuthPreviewCard } from './Preview';

interface AuthShowcaseProps {
	content: AuthShowcaseContent;
}

export const AuthShowcase: React.FC<AuthShowcaseProps> = props => {
	return (
		<aside className="auth-showcase">
			<span className="auth-breathing-glow auth-breathing-glow--showcase" aria-hidden="true" />
			<AuthBrand />

			<div className="showcase-copy">
				<span className="showcase-kicker animate-pulse">
					<span /> {props.content.kicker}
				</span>
				<h1>{props.content.title}</h1>
				<p>{props.content.description}</p>
			</div>

			<div className="showcase-preview" aria-hidden="true">
				{props.content.previews.map(preview => (
					<AuthPreviewCard key={preview.name} preview={preview} />
				))}
			</div>
		</aside>
	);
};

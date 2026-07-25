import type { AuthPreview } from '../types';

interface AuthPreviewCardProps {
	preview: AuthPreview;
}

export const AuthPreviewCard: React.FC<AuthPreviewCardProps> = props => {
	return (
		<div className="preview-card">
			<span className="preview-avatar">{props.preview.initials}</span>
			<span className="preview-copy">
				<strong>{props.preview.name}</strong>
				<span>{props.preview.message}</span>
			</span>
			<time>{props.preview.time}</time>
		</div>
	);
};

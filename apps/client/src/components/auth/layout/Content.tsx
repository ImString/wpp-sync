import type { PropsWithChildren } from 'react';

import { ThemeSwitcher } from '@/components/interface';

import { AuthBrand } from '../brand';
import { AuthHeader } from './Header';

interface AuthContentProps extends PropsWithChildren {
	eyebrow: string;
	title: string;
	description: string;
}

export const AuthContent: React.FC<AuthContentProps> = props => {
	return (
		<section className="auth-content">
			<span className="auth-breathing-glow auth-breathing-glow--content" aria-hidden="true" />
			<AuthBrand mobile />
			<ThemeSwitcher className="auth-theme-button" />

			<div className="auth-content__inner">
				<AuthHeader eyebrow={props.eyebrow} title={props.title} description={props.description} />
				{props.children}
			</div>
		</section>
	);
};

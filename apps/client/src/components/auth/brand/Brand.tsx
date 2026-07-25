import { twMerge } from 'tailwind-merge';

import { Brand } from '@/components/brand';

interface AuthBrandProps {
	mobile?: boolean;
}

export const AuthBrand: React.FC<AuthBrandProps> = props => {
	return (
		<Brand
			className={twMerge('auth-brand', props.mobile && 'mobile-brand')}
			markClassName="auth-brand__mark"
			nameClassName="auth-brand__name"
			to="/auth/login"
		/>
	);
};

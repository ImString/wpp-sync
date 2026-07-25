import { CheckboxInput } from '@/components/inputs';

export const RegisterTerms: React.FC = () => {
	return (
		<CheckboxInput
			name="terms"
			label={
				<>
					Concordo com os{' '}
					<a className="auth-link" href="#terms">
						Termos de Uso
					</a>{' '}
					e a{' '}
					<a className="auth-link" href="#privacy">
						Política de Privacidade
					</a>
					.
				</>
			}
		/>
	);
};

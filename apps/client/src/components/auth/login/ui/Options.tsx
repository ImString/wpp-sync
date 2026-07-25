import { CheckboxInput } from '@/components/inputs';

export const LoginOptions: React.FC = () => {
	return (
		<div className="form-options">
			<CheckboxInput name="remember" label="Lembrar meu acesso" />

			<button className="auth-link auth-link-button" type="button">
				Esqueci minha senha
			</button>
		</div>
	);
};

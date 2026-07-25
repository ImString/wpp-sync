import { Form, Formik } from 'formik';
import { MdLockOutline, MdOutlineEmail } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import type { InferType } from 'yup';

import { Button } from '@/components/buttons';
import { TextInput } from '@/components/inputs';

import { AuthToast } from '../../feedback';
import { AuthDivider, AuthGoogleButton, AuthSwitchLink } from '../../form';
import { useAuthToast } from '../../hooks';
import { LoginFormSchema } from '../model/schema';
import { LoginOptions } from './Options';

export const LoginForm: React.FC = () => {
	const navigate = useNavigate();
	const toast = useAuthToast();

	const handleSubmit = async () => {
		toast.showToast('Login realizado com sucesso.');
		await new Promise(resolve => window.setTimeout(resolve, 900));
		navigate('/');
	};

	return (
		<>
			<Formik<InferType<ReturnType<typeof LoginFormSchema>>>
				initialValues={{ email: '', password: '', remember: false }}
				validationSchema={LoginFormSchema()}
				validateOnChange={false}
				onSubmit={handleSubmit}>
				{formikProps => (
					<Form className="auth-form" noValidate>
						<TextInput
							name="email"
							label="E-mail"
							icon={MdOutlineEmail}
							type="email"
							placeholder="seuemail@empresa.com"
							autoComplete="email"
						/>

						<TextInput
							name="password"
							label="Senha"
							icon={MdLockOutline}
							type="password"
							placeholder="Digite sua senha"
							autoComplete="current-password"
						/>

						<LoginOptions />
						<Button type="submit" className="submit-button" loading={formikProps.isSubmitting}>
							Entrar
						</Button>
					</Form>
				)}
			</Formik>

			<AuthDivider>ou continue com</AuthDivider>
			<AuthGoogleButton>Entrar com Google</AuthGoogleButton>
			<AuthSwitchLink message="Ainda não possui uma conta?" label="Criar conta" to="/auth/register" />
			<AuthToast message={toast.message} isVisible={toast.isVisible} />
		</>
	);
};

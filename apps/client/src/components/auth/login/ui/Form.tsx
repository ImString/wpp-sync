import { Form, Formik } from 'formik';
import type { FormikHelpers } from 'formik';
import { useState } from 'react';
import { MdLockOutline, MdOutlineEmail } from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { authAPI, getResponseErrors, getResponseMessage, renewAuthToken } from '@/utils/api';
import { saveGoogleOAuthRequest } from '@/utils/auth';

import { Button } from '@/components/buttons';
import { TextInput } from '@/components/inputs';
import { useAuthenticationStore } from '@/stores';

import { AuthToast } from '../../feedback';
import { AuthDivider, AuthGoogleButton, AuthSwitchLink } from '../../form';
import { useAuthToast } from '../../hooks';
import { LoginFormSchema } from '../model/schema';
import type { LoginFormData } from '../model/types';
import { LoginOptions } from './Options';

interface LoginLocationState {
	from?: string;
	registeredEmail?: string;
}

export const LoginForm: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const toast = useAuthToast();
	const [googleLoading, setGoogleLoading] = useState(false);
	const { setCurrentUser, clearAuthentication } = useAuthenticationStore(
		useShallow(state => ({
			setCurrentUser: state.setCurrentUser,
			clearAuthentication: state.clearAuthentication
		}))
	);
	const locationState = location.state as LoginLocationState | null;

	const handleGoogleLogin = async () => {
		setGoogleLoading(true);

		try {
			const response = await authAPI.getGoogleAuthUrl();

			if (!response.success || !response.data?.url || !response.data.state) {
				toast.showToast(getResponseMessage(response, 'Não foi possível iniciar o login com Google.'), 'error');
				setGoogleLoading(false);
				return;
			}

			saveGoogleOAuthRequest(response.data.state, locationState?.from);
			window.location.assign(response.data.url);
		} catch {
			toast.showToast('Não foi possível conectar ao servidor. Tente novamente.', 'error');
			setGoogleLoading(false);
		}
	};

	const handleSubmit = async (values: LoginFormData, helpers: FormikHelpers<LoginFormData>) => {
		try {
			const response = await authAPI.login({ email: values.email, password: values.password });

			if (!response.success || !response.data?.refreshToken) {
				const errors = getResponseErrors(response);
				helpers.setErrors({ email: errors.email, password: errors.password });
				toast.showToast(getResponseMessage(response, 'E-mail ou senha inválidos.'), 'error');
				return;
			}

			const authToken = await renewAuthToken({
				refreshToken: response.data.refreshToken,
				remember: values.remember
			});

			if (!authToken) {
				toast.showToast('Não foi possível iniciar sua sessão. Tente novamente.', 'error');
				return;
			}

			const userResponse = await authAPI.me();

			if (!userResponse.success || !userResponse.data) {
				clearAuthentication();
				toast.showToast(getResponseMessage(userResponse, 'Não foi possível carregar seu usuário.'), 'error');
				return;
			}

			setCurrentUser(userResponse.data);
			toast.showToast('Login realizado com sucesso.');
			navigate(locationState?.from || '/', { replace: true });
		} catch {
			clearAuthentication();
			toast.showToast('Não foi possível conectar ao servidor. Tente novamente.', 'error');
		}
	};

	return (
		<>
			<Formik<LoginFormData>
				initialValues={{ email: locationState?.registeredEmail || '', password: '', remember: false }}
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
			<AuthGoogleButton onClick={handleGoogleLogin} loading={googleLoading}>
				Entrar com Google
			</AuthGoogleButton>
			<AuthSwitchLink message="Ainda não possui uma conta?" label="Criar conta" to="/auth/register" />
			<AuthToast message={toast.message} isVisible={toast.isVisible} variant={toast.variant} />
		</>
	);
};

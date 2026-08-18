import { Form, Formik } from 'formik';
import type { FormikHelpers } from 'formik';
import { useRef, useState } from 'react';
import { MdLockOutline, MdOutlineEmail } from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { authAPI, getResponseErrors, getResponseMessage, renewAuthToken } from '@/utils/api';
import { saveGoogleOAuthRequest } from '@/utils/auth';

import { Button } from '@/components/buttons';
import { TextInput } from '@/components/inputs';
import { useAuthenticationStore } from '@/stores';

import { AuthToast } from '../../feedback';
import { AuthDivider, AuthGoogleButton, AuthSwitchLink, AuthTurnstile } from '../../form';
import type { AuthTurnstileHandle } from '../../form';
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
	const turnstileRef = useRef<AuthTurnstileHandle>(null);
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
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
		if (!turnstileToken) {
			toast.showToast('Conclua a verificação de segurança para continuar.', 'error');
			return;
		}

		let completed = false;

		try {
			const response = await authAPI.login({
				email: values.email,
				password: values.password,
				turnstileToken
			});

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
			completed = true;
			navigate(locationState?.from || '/', { replace: true });
		} catch {
			clearAuthentication();
			toast.showToast('Não foi possível conectar ao servidor. Tente novamente.', 'error');
		} finally {
			if (!completed) turnstileRef.current?.reset();
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
						<AuthTurnstile ref={turnstileRef} action="login" onTokenChange={setTurnstileToken} />
						<Button
							type="submit"
							className="submit-button"
							loading={formikProps.isSubmitting}
							disabled={!turnstileToken}>
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

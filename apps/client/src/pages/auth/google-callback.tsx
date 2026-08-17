import { useEffect, useState } from 'react';
import { MdErrorOutline } from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';

import { authAPI, getResponseMessage } from '@/utils/api';
import { consumeGoogleOAuthRequest } from '@/utils/auth';

import { AuthLayout } from '@/components/auth';
import type { AuthShowcaseContent } from '@/components/auth';
import { Button } from '@/components/buttons';
import { Loading } from '@/components/loading';
import { useAuthenticationStore } from '@/stores';

interface GoogleCallbackResult {
	success: boolean;
	message?: string;
	returnTo?: string;
}

const callbackRequests = new Map<string, Promise<GoogleCallbackResult>>();

const showcase: AuthShowcaseContent = {
	kicker: 'Acesso seguro',
	title: (
		<>
			Seu atendimento continua <em>sincronizado.</em>
		</>
	),
	description: 'Use sua conta Google para entrar com segurança e voltar rapidamente às suas conversas.',
	previews: [
		{ initials: 'JC', name: 'Juliana Costa', message: 'Olá! Gostaria de saber mais...', time: '11:42' },
		{ initials: 'LM', name: 'Lucas Mendes', message: 'Perfeito, obrigado pelo atendimento!', time: '11:28' }
	]
};

const completeGoogleLogin = async (search: string): Promise<GoogleCallbackResult> => {
	const query = new URLSearchParams(search);
	const code = query.get('code');
	const state = query.get('state');
	const providerError = query.get('error');
	const request = consumeGoogleOAuthRequest();

	if (!state || !request || request.state !== state) {
		return { success: false, message: 'Esta tentativa de login expirou ou não é válida. Inicie novamente.' };
	}

	if (providerError) {
		return {
			success: false,
			message:
				providerError === 'access_denied'
					? 'O acesso com Google foi cancelado.'
					: 'O Google não autorizou o acesso à sua conta.'
		};
	}

	if (!code) {
		return { success: false, message: 'O Google não retornou o código necessário para concluir o login.' };
	}

	const authentication = useAuthenticationStore.getState();

	try {
		const response = await authAPI.googleLogin({ code, state });
		if (!response.success || !response.data?.token || !response.data.refreshToken) {
			authentication.clearAuthentication();
			return {
				success: false,
				message: getResponseMessage(response, 'Não foi possível validar seu login com Google.')
			};
		}

		authentication.setRefreshToken(response.data.refreshToken, false);
		authentication.setAuthToken(response.data.token);

		const userResponse = await authAPI.me();
		if (!userResponse.success || !userResponse.data) {
			useAuthenticationStore.getState().clearAuthentication();
			return {
				success: false,
				message: getResponseMessage(userResponse, 'Não foi possível carregar os dados da sua conta.')
			};
		}

		useAuthenticationStore.getState().setCurrentUser(userResponse.data);
		return { success: true, returnTo: request.returnTo };
	} catch {
		useAuthenticationStore.getState().clearAuthentication();
		return { success: false, message: 'Não foi possível conectar ao servidor. Tente novamente.' };
	}
};

const getGoogleCallbackRequest = (search: string) => {
	const cachedRequest = callbackRequests.get(search);
	if (cachedRequest) return cachedRequest;

	const request = completeGoogleLogin(search);
	callbackRequests.set(search, request);
	void request.finally(() => window.setTimeout(() => callbackRequests.delete(search), 1_000));

	return request;
};

export const GoogleCallbackPage: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [errorMessage, setErrorMessage] = useState<string>();

	useEffect(() => {
		let active = true;

		void getGoogleCallbackRequest(location.search).then(result => {
			if (!active) return;

			if (result.success) {
				navigate(result.returnTo || '/', { replace: true });
				return;
			}

			setErrorMessage(result.message || 'Não foi possível concluir seu login com Google.');
		});

		return () => {
			active = false;
		};
	}, [location.search, navigate]);

	if (!errorMessage) return <Loading label="Validando seu login com Google..." />;

	return (
		<AuthLayout
			ariaLabel="Retorno do login com Google"
			eyebrow="Acesso não concluído"
			title="Não foi possível entrar"
			description={errorMessage}
			showcase={showcase}>
			<div className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-center dark:border-red-900/70 dark:bg-red-950/30">
				<MdErrorOutline className="size-8 text-red-600 dark:text-red-400" aria-hidden="true" />
				<p className="text-xs leading-5 text-red-700 dark:text-red-300">
					Revise a autorização e tente novamente.
				</p>
				<Button
					className="submit-button w-full"
					type="button"
					onClick={() => navigate('/auth/login', { replace: true })}>
					Voltar para o login
				</Button>
			</div>
		</AuthLayout>
	);
};

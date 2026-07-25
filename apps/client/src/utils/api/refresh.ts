import axios from 'axios';

import { useAuthenticationStore } from '@/stores';

import { apiUrl } from './config';
import type { ServerResponse } from './types';

interface RefreshAuthenticationData {
	token: string;
	refreshToken?: string;
}

interface RenewAuthTokenOptions {
	refreshToken?: string;
	remember?: boolean;
}

const refreshAPI = axios.create({
	baseURL: apiUrl,
	timeout: 15_000,
	validateStatus: () => true
});

let activeRefreshRequest: Promise<string | null> | null = null;

const requestAuthToken = async (options?: RenewAuthTokenOptions) => {
	const authentication = useAuthenticationStore.getState();
	const refreshToken = options?.refreshToken || authentication.refreshToken;

	if (!refreshToken) {
		authentication.clearAuthentication();
		return null;
	}

	if (options?.refreshToken) {
		authentication.setRefreshToken(options.refreshToken, options.remember);
	}

	try {
		const response = await refreshAPI.post<ServerResponse<RefreshAuthenticationData>>('/auth/refresh-token', {
			refresh_token: refreshToken
		});

		const currentAuthentication = useAuthenticationStore.getState();

		if (currentAuthentication.refreshToken !== refreshToken) return null;

		if (!response.data.success || !response.data.data?.token) {
			currentAuthentication.clearAuthentication();
			return null;
		}

		currentAuthentication.setAuthToken(response.data.data.token);

		if (response.data.data.refreshToken) {
			currentAuthentication.setRefreshToken(response.data.data.refreshToken);
		}

		return response.data.data.token;
	} catch {
		const currentAuthentication = useAuthenticationStore.getState();
		if (currentAuthentication.refreshToken === refreshToken) currentAuthentication.clearAuthentication();
		return null;
	}
};

export const renewAuthToken = (options?: RenewAuthTokenOptions) => {
	if (!activeRefreshRequest) {
		activeRefreshRequest = requestAuthToken(options).finally(() => {
			activeRefreshRequest = null;
		});
	}

	return activeRefreshRequest;
};

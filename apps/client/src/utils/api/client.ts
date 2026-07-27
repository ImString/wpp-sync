import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

import { getAuthToken } from '@/utils/auth';

import { useAuthenticationStore } from '@/stores/auth';

import { apiUrl } from './config';
import { renewAuthToken } from './refresh';
import type { ServerResponse } from './types';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
	_authRetry?: boolean;
}

export const mainAPI = axios.create({
	baseURL: apiUrl,
	timeout: 15_000,
	validateStatus: () => true
});

mainAPI.interceptors.request.use(config => {
	const authToken = getAuthToken();

	if (authToken && !config.headers.Authorization) {
		config.headers.Authorization = `Bearer ${authToken}`;
	}

	return config;
});

mainAPI.interceptors.response.use(async response => {
	if (response.status !== 401) return response;

	const config = response.config as RetryableRequestConfig;
	const responseData = response.data as ServerResponse;
	const isPublicAuthenticationRequest = ['/auth/login', '/auth/register', '/auth/logout'].some(route =>
		config.url?.endsWith(route)
	);

	if (isPublicAuthenticationRequest) return response;

	if (config._authRetry || responseData.code !== 'INVALID_TOKEN') {
		useAuthenticationStore.getState().clearAuthentication();
		return response;
	}

	config._authRetry = true;
	const authToken = await renewAuthToken();

	if (!authToken) return response;

	config.headers.Authorization = `Bearer ${authToken}`;
	return mainAPI.request(config);
});

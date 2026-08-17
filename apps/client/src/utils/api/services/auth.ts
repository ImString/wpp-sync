import type { AuthUser } from '@/stores/auth';

import { mainAPI } from '../client';
import type { ServerResponse } from '../types';

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginData {
	token: string;
	refreshToken: string;
}

export interface GoogleAuthUrlData {
	url: string;
	state: string;
}

export interface GoogleLoginRequest {
	code?: string;
	token?: string;
	state: string;
}

export interface GoogleLoginData extends LoginData {
	isNewIntegration: boolean;
}

export interface RegisterRequest {
	name: string;
	company?: string;
	email: string;
	password: string;
}

export const authAPI = {
	login: async (data: LoginRequest) => {
		const response = await mainAPI.post<ServerResponse<LoginData>>('/auth/login', data);
		return response.data;
	},

	register: async (data: RegisterRequest) => {
		const response = await mainAPI.post<ServerResponse<AuthUser>>('/auth/register', data);
		return response.data;
	},

	getGoogleAuthUrl: async () => {
		const response = await mainAPI.get<ServerResponse<GoogleAuthUrlData>>('/auth/google/url');
		return response.data;
	},

	googleLogin: async (data: GoogleLoginRequest) => {
		const response = await mainAPI.post<ServerResponse<GoogleLoginData>>('/auth/google/login', data);
		return response.data;
	},

	me: async (signal?: AbortSignal) => {
		const response = await mainAPI.get<ServerResponse<AuthUser>>('/user/me', { signal });
		return response.data;
	},

	logout: async (refreshToken?: string | null, authToken?: string | null) => {
		const response = await mainAPI.post<ServerResponse>(
			'/auth/logout',
			{ refresh_token: refreshToken },
			{
				headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined
			}
		);
		return response.data;
	}
};

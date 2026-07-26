import type { AuthUser } from '@/stores/auth';

import { mainAPI } from '../client';
import type { ServerResponse } from '../types';

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginData {
	refreshToken: string;
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

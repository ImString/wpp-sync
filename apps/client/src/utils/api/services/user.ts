import type { AuthUser } from '@/stores/auth';

import { mainAPI } from '../client';
import type { ServerResponse } from '../types';

export interface UpdatePasswordRequest {
	currentPassword?: string;
	newPassword: string;
}

export interface UpdatePasswordData {
	hasPassword: boolean;
}

export const userAPI = {
	updateProfile: async (data: FormData) => {
		const response = await mainAPI.put<ServerResponse<AuthUser>>('/user/update', data);
		return response.data;
	},

	updatePassword: async (data: UpdatePasswordRequest) => {
		const response = await mainAPI.put<ServerResponse<UpdatePasswordData>>('/user/password', data);
		return response.data;
	}
};

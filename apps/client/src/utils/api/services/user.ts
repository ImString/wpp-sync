import type { AuthUser } from '@/stores/auth';

import { mainAPI } from '../client';
import type { ServerResponse } from '../types';

export const userAPI = {
	updateProfile: async (data: FormData) => {
		const response = await mainAPI.put<ServerResponse<AuthUser>>('/user/update', data);
		return response.data;
	}
};

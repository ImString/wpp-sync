import { create } from 'zustand';

import {
	getAuthToken,
	getRefreshToken,
	removeAuthToken,
	removeRefreshToken,
	saveAuthToken,
	saveRefreshToken
} from '@/utils/auth';

import type { AuthenticationStore } from './types';

export const useAuthenticationStore = create<AuthenticationStore>()(set => ({
	authToken: getAuthToken(),
	refreshToken: getRefreshToken(),
	currentUser: null,
	status: 'idle',

	setChecking: () => set({ status: 'checking' }),

	setAuthToken: authToken => {
		if (authToken) saveAuthToken(authToken);
		else removeAuthToken();

		set({ authToken });
	},

	setRefreshToken: (refreshToken, remember) => {
		if (refreshToken) saveRefreshToken(refreshToken, remember);
		else removeRefreshToken();

		set({ refreshToken });
	},

	setCurrentUser: currentUser => set({ currentUser, status: 'authenticated' }),

	clearAuthentication: () => {
		removeAuthToken();
		removeRefreshToken();
		set({ authToken: null, refreshToken: null, currentUser: null, status: 'unauthenticated' });
	}
}));

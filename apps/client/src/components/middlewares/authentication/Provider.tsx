import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';

import { authAPI, renewAuthToken } from '@/utils/api';

import { useAuthenticationStore } from '@/stores';

export const AuthenticationProvider: React.FC<PropsWithChildren> = props => {
	useEffect(() => {
		const controller = new AbortController();

		const validateAuthentication = async () => {
			const authentication = useAuthenticationStore.getState();

			if (!authentication.authToken && !authentication.refreshToken) {
				authentication.clearAuthentication();
				return;
			}

			authentication.setChecking();

			try {
				if (!authentication.authToken) {
					const renewedAuthToken = await renewAuthToken();
					if (controller.signal.aborted) return;

					if (!renewedAuthToken) {
						useAuthenticationStore.getState().clearAuthentication();
						return;
					}
				}

				const response = await authAPI.me(controller.signal);
				if (controller.signal.aborted) return;

				if (!response.success || !response.data) {
					useAuthenticationStore.getState().clearAuthentication();
					return;
				}

				useAuthenticationStore.getState().setCurrentUser(response.data);
			} catch {
				if (!controller.signal.aborted) {
					useAuthenticationStore.getState().clearAuthentication();
				}
			}
		};

		void validateAuthentication();

		return () => controller.abort();
	}, []);

	return props.children;
};

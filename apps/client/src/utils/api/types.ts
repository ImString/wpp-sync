export interface ServerResponse<T = unknown> {
	success: boolean;
	status?: number;
	code?: string;
	data?: T;
}

interface ErrorResponseData {
	message?: string;
	errors?: Record<string, string>;
}

const getErrorData = (response?: ServerResponse<unknown>) => {
	if (!response?.data || typeof response.data !== 'object') return undefined;
	return response.data as ErrorResponseData;
};

export const getResponseMessage = (response: ServerResponse<unknown> | undefined, fallback: string) => {
	return getErrorData(response)?.message || fallback;
};

export const getResponseErrors = (response?: ServerResponse<unknown>) => {
	return getErrorData(response)?.errors || {};
};

export interface LoginFormData {
	email: string;
	password: string;
	remember: boolean;
}

export type LoginFormErrors = Partial<Record<keyof Pick<LoginFormData, 'email' | 'password'>, string>>;

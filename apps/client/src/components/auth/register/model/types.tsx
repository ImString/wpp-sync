export interface RegisterFormData {
	name: string;
	company: string;
	email: string;
	password: string;
	confirmPassword: string;
	terms: boolean;
}

export type RegisterField = keyof Omit<RegisterFormData, 'terms'>;
export type RegisterFormErrors = Partial<Record<RegisterField, string>>;

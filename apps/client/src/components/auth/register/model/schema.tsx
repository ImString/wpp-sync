import { boolean, object, ref, string } from 'yup';

export const RegisterFormSchema = () => {
	return object().shape({
		name: string().required('Preencha este campo.'),
		company: string().default(''),
		email: string().email('Informe um e-mail válido.').required('Preencha este campo.'),
		password: string().min(8, 'Use pelo menos 8 caracteres.').required('Preencha este campo.'),
		confirmPassword: string()
			.oneOf([ref('password')], 'As senhas não coincidem.')
			.required('Preencha este campo.'),
		terms: boolean().oneOf([true], 'Você precisa aceitar os termos para continuar.').required()
	});
};

import { boolean, object, string } from 'yup';

export const LoginFormSchema = () => {
	return object().shape({
		email: string().email('Informe um e-mail válido.').required('Preencha este campo.'),
		password: string().required('Preencha este campo.'),
		remember: boolean().required()
	});
};

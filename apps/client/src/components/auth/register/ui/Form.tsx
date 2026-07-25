import { Form, Formik } from 'formik';
import type { FormikHelpers } from 'formik';
import { MdLockOutline, MdOutlineBusiness, MdOutlineEmail, MdOutlinePerson } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { authAPI, getResponseErrors, getResponseMessage } from '@/utils/api';

import { Button } from '@/components/buttons';
import { TextInput } from '@/components/inputs';

import { AuthToast } from '../../feedback';
import { AuthSwitchLink } from '../../form';
import { useAuthToast } from '../../hooks';
import { RegisterFormSchema } from '../model/schema';
import type { RegisterFormData } from '../model/types';
import { RegisterNote } from './Note';
import { RegisterTerms } from './Terms';

export const RegisterForm: React.FC = () => {
	const navigate = useNavigate();
	const toast = useAuthToast();

	const handleSubmit = async (values: RegisterFormData, helpers: FormikHelpers<RegisterFormData>) => {
		try {
			const response = await authAPI.register({
				name: values.name,
				company: values.company || undefined,
				email: values.email,
				password: values.password
			});

			if (!response.success) {
				const errors = getResponseErrors(response);
				helpers.setErrors({
					name: errors.name,
					company: errors.company,
					email: errors.email,
					password: errors.password,
					confirmPassword: errors.confirmPassword
				});
				toast.showToast(getResponseMessage(response, 'Não foi possível criar sua conta.'), 'error');
				return;
			}

			toast.showToast('Conta criada. Agora faça seu login.');
			await new Promise(resolve => window.setTimeout(resolve, 650));
			navigate('/auth/login', { replace: true, state: { registeredEmail: values.email } });
		} catch {
			toast.showToast('Não foi possível conectar ao servidor. Tente novamente.', 'error');
		}
	};

	return (
		<>
			<Formik<RegisterFormData>
				initialValues={{
					name: '',
					company: '',
					email: '',
					password: '',
					confirmPassword: '',
					terms: false
				}}
				validationSchema={RegisterFormSchema()}
				validateOnChange={false}
				onSubmit={handleSubmit}>
				{formikProps => (
					<Form className="auth-form" noValidate>
						<div className="form-row">
							<TextInput
								name="name"
								label="Nome"
								icon={MdOutlinePerson}
								placeholder="Seu nome"
								autoComplete="name"
							/>

							<TextInput
								name="company"
								label="Empresa"
								icon={MdOutlineBusiness}
								placeholder="Sua empresa"
								autoComplete="organization"
							/>
						</div>

						<TextInput
							name="email"
							label="E-mail profissional"
							icon={MdOutlineEmail}
							type="email"
							placeholder="seuemail@empresa.com"
							autoComplete="email"
						/>

						<div className="form-row">
							<TextInput
								name="password"
								label="Senha"
								icon={MdLockOutline}
								type="password"
								placeholder="Mínimo 8 caracteres"
								autoComplete="new-password"
							/>

							<TextInput
								name="confirmPassword"
								label="Confirmar senha"
								icon={MdLockOutline}
								type="password"
								placeholder="Repita a senha"
								autoComplete="new-password"
							/>
						</div>

						<RegisterTerms />
						<Button type="submit" className="submit-button" loading={formikProps.isSubmitting}>
							Criar minha conta
						</Button>
					</Form>
				)}
			</Formik>

			<RegisterNote />
			<AuthSwitchLink message="Já possui uma conta?" label="Entrar" to="/auth/login" />
			<AuthToast message={toast.message} isVisible={toast.isVisible} variant={toast.variant} />
		</>
	);
};

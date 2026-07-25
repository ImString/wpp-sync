import { Form, Formik } from 'formik';
import { MdLockOutline, MdOutlineBusiness, MdOutlineEmail, MdOutlinePerson } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import type { InferType } from 'yup';

import { Button } from '@/components/buttons';
import { TextInput } from '@/components/inputs';

import { AuthToast } from '../../feedback';
import { AuthSwitchLink } from '../../form';
import { useAuthToast } from '../../hooks';
import { RegisterFormSchema } from '../model/schema';
import { RegisterNote } from './Note';
import { RegisterTerms } from './Terms';

export const RegisterForm: React.FC = () => {
	const navigate = useNavigate();
	const toast = useAuthToast();

	const handleSubmit = async () => {
		toast.showToast('Conta criada. Agora faça seu login.');
		await new Promise(resolve => window.setTimeout(resolve, 900));
		navigate('/auth/login');
	};

	return (
		<>
			<Formik<InferType<ReturnType<typeof RegisterFormSchema>>>
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
			<AuthToast message={toast.message} isVisible={toast.isVisible} />
		</>
	);
};

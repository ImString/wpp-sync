import { Form, Formik } from 'formik';
import type { FormikHelpers } from 'formik';
import { MdLockOutline, MdPassword, MdSecurity } from 'react-icons/md';
import { useShallow } from 'zustand/react/shallow';

import { getResponseErrors, getResponseMessage, userAPI } from '@/utils/api';

import { Button } from '@/components/buttons';
import { TextInput } from '@/components/inputs';
import { useAuthenticationStore } from '@/stores';

import type { SettingsFeedback } from './types';

interface PasswordSettingsProps {
	onFeedback: (feedback: SettingsFeedback) => void;
}

interface PasswordForm {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

type PasswordErrors = Partial<Record<keyof PasswordForm, string>>;

const initialValues: PasswordForm = {
	currentPassword: '',
	newPassword: '',
	confirmPassword: ''
};

export const PasswordSettings: React.FC<PasswordSettingsProps> = ({ onFeedback }) => {
	const { currentUser, setCurrentUser } = useAuthenticationStore(
		useShallow(state => ({
			currentUser: state.currentUser,
			setCurrentUser: state.setCurrentUser
		}))
	);
	const hasPassword = Boolean(currentUser?.hasPassword);

	const validate = (values: PasswordForm) => {
		const errors: PasswordErrors = {};

		if (hasPassword && !values.currentPassword) errors.currentPassword = 'Informe sua senha atual.';
		if (!values.newPassword) errors.newPassword = 'Informe a nova senha.';
		else if (values.newPassword.length < 8) errors.newPassword = 'Use pelo menos 8 caracteres.';
		else if (values.newPassword.length > 64) errors.newPassword = 'Use no máximo 64 caracteres.';
		else if (hasPassword && values.newPassword === values.currentPassword) {
			errors.newPassword = 'A nova senha deve ser diferente da atual.';
		}

		if (!values.confirmPassword) errors.confirmPassword = 'Confirme a nova senha.';
		else if (values.confirmPassword !== values.newPassword) {
			errors.confirmPassword = 'As senhas não coincidem.';
		}

		return errors;
	};

	const handleSubmit = async (values: PasswordForm, helpers: FormikHelpers<PasswordForm>) => {
		try {
			const response = await userAPI.updatePassword({
				...(hasPassword && { currentPassword: values.currentPassword }),
				newPassword: values.newPassword
			});

			if (!response.success || !response.data?.hasPassword) {
				const responseErrors = getResponseErrors(response);
				helpers.setErrors({
					currentPassword:
						response.code === 'CURRENT_PASSWORD_INCORRECT'
							? 'A senha atual está incorreta.'
							: responseErrors.currentPassword,
					newPassword: responseErrors.newPassword
				});
				onFeedback({
					type: 'error',
					message:
						response.code === 'CURRENT_PASSWORD_INCORRECT'
							? 'Confira sua senha atual e tente novamente.'
							: getResponseMessage(response, 'Não foi possível atualizar sua senha.')
				});
				return;
			}

			helpers.resetForm();
			if (currentUser) setCurrentUser({ ...currentUser, hasPassword: true });
			onFeedback({
				type: 'success',
				message: hasPassword ? 'Senha alterada com sucesso.' : 'Senha definida com sucesso.'
			});
		} catch {
			onFeedback({ type: 'error', message: 'Não foi possível conectar ao servidor. Tente novamente.' });
		}
	};

	return (
		<section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-panel dark:border-[#223138] dark:bg-[#0e181e] wide:col-start-1 wide:row-start-2">
			<header className="flex items-start gap-3 border-b border-slate-200 px-5 py-4.5 dark:border-[#223138] mobile:px-6">
				<span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
					<MdSecurity className="size-4.5" aria-hidden="true" />
				</span>
				<div>
					<h2 className="m-0 text-sm font-bold text-slate-900 dark:text-white">
						{hasPassword ? 'Alterar senha' : 'Definir senha'}
					</h2>
					<p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
						{hasPassword
							? 'Confirme sua senha atual antes de escolher uma nova.'
							: 'Sua conta usa o Google. Defina uma senha para também entrar usando e-mail e senha.'}
					</p>
				</div>
			</header>

			<Formik<PasswordForm>
				initialValues={initialValues}
				validate={validate}
				validateOnChange={false}
				onSubmit={handleSubmit}>
				{formikProps => (
					<Form noValidate>
						<div className="grid gap-4 px-5 py-5 mobile:grid-cols-2 mobile:px-6 mobile:py-6">
							{hasPassword && (
								<TextInput
									className="mobile:col-span-2"
									name="currentPassword"
									label="Senha atual"
									icon={MdLockOutline}
									type="password"
									autoComplete="current-password"
									placeholder="Digite sua senha atual"
								/>
							)}

							<TextInput
								name="newPassword"
								label="Nova senha"
								icon={MdPassword}
								type="password"
								autoComplete="new-password"
								placeholder="Mínimo de 8 caracteres"
							/>

							<TextInput
								name="confirmPassword"
								label="Confirmar nova senha"
								icon={MdLockOutline}
								type="password"
								autoComplete="new-password"
								placeholder="Repita a nova senha"
							/>
						</div>

						<footer className="flex justify-end border-t border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-[#223138] dark:bg-[#101b21] mobile:px-6">
							<Button
								theme="primary"
								type="submit"
								className="min-h-10 text-[11px]"
								loading={formikProps.isSubmitting}
								loadingLabel={hasPassword ? 'Alterando...' : 'Definindo...'}>
								<MdSecurity aria-hidden="true" />
								{hasPassword ? 'Alterar senha' : 'Definir senha'}
							</Button>
						</footer>
					</Form>
				)}
			</Formik>
		</section>
	);
};

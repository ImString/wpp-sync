import { AuthLayout, LoginForm } from '@/components/auth';
import type { AuthShowcaseContent } from '@/components/auth';

const showcase: AuthShowcaseContent = {
	kicker: 'Atendimento conectado',
	title: (
		<>
			Suas conversas em <em>um só lugar.</em>
		</>
	),
	description:
		'Centralize atendimentos, acompanhe clientes e mantenha sua equipe sincronizada em uma experiência simples e profissional.',
	previews: [
		{ initials: 'JC', name: 'Juliana Costa', message: 'Olá! Gostaria de saber mais...', time: '11:42' },
		{ initials: 'LM', name: 'Lucas Mendes', message: 'Perfeito, obrigado pelo atendimento!', time: '11:28' }
	]
};

export const LoginPage: React.FC = () => {
	return (
		<AuthLayout
			ariaLabel="Acesso ao WppSync"
			eyebrow="Bem-vindo de volta"
			title="Entre na sua conta"
			description="Use suas credenciais para acessar a central de atendimento."
			showcase={showcase}>
			<LoginForm />
		</AuthLayout>
	);
};

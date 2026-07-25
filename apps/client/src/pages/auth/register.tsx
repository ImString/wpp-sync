import { AuthLayout, RegisterForm } from '@/components/auth';
import type { AuthShowcaseContent } from '@/components/auth';

const showcase: AuthShowcaseContent = {
	kicker: 'Comece em minutos',
	title: (
		<>
			Atendimento melhor, equipe mais <em>sincronizada.</em>
		</>
	),
	description:
		'Crie seu espaço, conecte os canais da sua empresa e organize cada conversa sem perder a proximidade com seus clientes.',
	previews: [
		{ initials: 'AP', name: 'Ana Paula', message: 'Vocês têm disponível na cor preta?', time: '10:57' },
		{ initials: 'EA', name: 'Empresa Alpha', message: 'Podemos agendar uma reunião.', time: '10:45' }
	],
	footerLabel: 'Configuração segura'
};

export const RegisterPage: React.FC = () => {
	return (
		<AuthLayout
			ariaLabel="Cadastro no WppSync"
			pageTitle="Criar conta"
			eyebrow="Nova conta"
			title="Crie seu espaço"
			description="Cadastre seus dados para começar a configurar o WppSync."
			showcase={showcase}>
			<RegisterForm />
		</AuthLayout>
	);
};

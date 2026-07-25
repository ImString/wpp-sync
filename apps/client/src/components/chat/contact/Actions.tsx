import { MdCall, MdEdit, MdWhatsapp } from 'react-icons/md';

import { Button } from '@/components/buttons';

export const ContactActions: React.FC = () => {
	return (
		<footer className="mt-auto grid grid-cols-3 gap-1.5 px-3 py-4">
			<Button theme="unstyled" type="button" className="contact-action">
				<MdCall aria-hidden="true" />
				<span>Ligar</span>
			</Button>
			<Button theme="unstyled" type="button" className="contact-action">
				<MdWhatsapp aria-hidden="true" />
				<span>WhatsApp</span>
			</Button>
			<Button theme="unstyled" type="button" className="contact-action">
				<MdEdit aria-hidden="true" />
				<span>Editar</span>
			</Button>
		</footer>
	);
};

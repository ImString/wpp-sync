import { useState } from 'react';
import type { FormEvent } from 'react';
import { MdAttachFile, MdEmojiEmotions, MdSend } from 'react-icons/md';

import { Button } from '@/components/buttons';

import { useChatStore } from '../store';

export const MessageComposer: React.FC = () => {
	const [message, setMessage] = useState('');
	const sendMessage = useChatStore(state => state.sendMessage);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const text = message.trim();

		if (!text) return;
		sendMessage(text);
		setMessage('');
	};

	return (
		<form
			className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-0.5 border-t border-slate-200 bg-white p-2 dark:border-[#223138] dark:bg-[#0e181e] mobile:min-h-17.5 mobile:grid-cols-[auto_auto_minmax(0,1fr)_auto] mobile:px-3.5 mobile:py-2.5"
			onSubmit={handleSubmit}>
			<Button theme="ghost" type="button" aria-label="Emoji" className="icon-button hidden mobile:grid">
				<MdEmojiEmotions aria-hidden="true" />
			</Button>
			<Button theme="ghost" type="button" aria-label="Anexar arquivo" className="icon-button">
				<MdAttachFile aria-hidden="true" />
			</Button>

			<input
				type="text"
				value={message}
				onChange={event => setMessage(event.target.value)}
				placeholder="Digite uma mensagem..."
				autoComplete="off"
				aria-label="Mensagem"
				className="h-11 min-w-0 rounded-xl border border-transparent bg-slate-100 px-3.5 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white dark:bg-[#131f26] dark:focus:bg-[#0e181e]"
			/>

			<Button type="submit" aria-label="Enviar mensagem" className="ml-1 size-10.75 min-h-10.75 rounded-xl p-0">
				<MdSend className="size-5.25" aria-hidden="true" />
			</Button>
		</form>
	);
};

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { MdArrowForward, MdChatBubbleOutline, MdClose, MdDoneAll, MdEmail, MdSend } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/buttons';

import { useWidgetSocket } from './useWidgetSocket';

type WidgetStage = 'welcome' | 'typing-email' | 'email' | 'typing-chat' | 'chat';

interface WidgetMessage {
	id: number;
	direction: 'received' | 'sent';
	text: string;
	time: string;
}

let messageSequence = 0;
const AUTOMATIC_REPLY_DELAY = 3200;

const createMessage = (direction: WidgetMessage['direction'], text: string): WidgetMessage => ({
	id: ++messageSequence,
	direction,
	text,
	time: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date())
});

const getInitials = (value: string) =>
	value
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map(part => part[0]?.toUpperCase())
		.join('') || 'WS';

const getSafePhotoURL = (value: string | null) => {
	if (!value) return undefined;

	try {
		const url = new URL(value, window.location.origin);
		return ['http:', 'https:'].includes(url.protocol) ? url.toString() : undefined;
	} catch {
		return undefined;
	}
};

export const WidgetPage: React.FC = () => {
	const [searchParams] = useSearchParams();
	const integrationId = searchParams.get('integrationId') || '';
	const workspaceUid = searchParams.get('workspaceUid') || '';
	const mode = searchParams.get('mode') === 'bubble' ? 'bubble' : 'embed';
	const title = searchParams.get('title')?.trim() || 'Atendimento';
	const photo = getSafePhotoURL(searchParams.get('photo'));
	const requestedTheme = searchParams.get('theme');

	const [stage, setStage] = useState<WidgetStage>('welcome');
	const [messages, setMessages] = useState<WidgetMessage[]>([]);
	const [email, setEmail] = useState('');
	const [emailError, setEmailError] = useState('');
	const [message, setMessage] = useState('');
	const messageListRef = useRef<HTMLDivElement>(null);
	const emailInputRef = useRef<HTMLInputElement>(null);
	const messageInputRef = useRef<HTMLInputElement>(null);
	const automaticReplyTimerRef = useRef<number>(undefined);
	const initials = useMemo(() => getInitials(title), [title]);
	const isTyping = stage === 'typing-email' || stage === 'typing-chat';
	const socketConnectionState = useWidgetSocket({ workspaceUid, integrationId });

	useEffect(() => {
		const previousDark = document.documentElement.classList.contains('dark');
		const previousLight = document.documentElement.classList.contains('light');
		const media = window.matchMedia('(prefers-color-scheme: dark)');

		const applyTheme = () => {
			const useDark = requestedTheme === 'dark' || (requestedTheme !== 'light' && media.matches);
			document.documentElement.classList.toggle('dark', useDark);
			document.documentElement.classList.toggle('light', !useDark);
		};

		applyTheme();
		media.addEventListener('change', applyTheme);

		return () => {
			media.removeEventListener('change', applyTheme);
			document.documentElement.classList.toggle('dark', previousDark);
			document.documentElement.classList.toggle('light', previousLight);
		};
	}, [requestedTheme]);

	useEffect(() => {
		messageListRef.current?.scrollTo({
			top: messageListRef.current.scrollHeight,
			behavior: 'smooth'
		});
	}, [messages, stage]);

	useEffect(
		() => () => {
			if (automaticReplyTimerRef.current !== undefined) {
				window.clearTimeout(automaticReplyTimerRef.current);
			}
		},
		[]
	);

	useEffect(() => {
		if (stage === 'email') emailInputRef.current?.focus();
		if (stage === 'chat') messageInputRef.current?.focus();
	}, [stage]);

	const scheduleAutomaticReply = (callback: () => void) => {
		if (automaticReplyTimerRef.current !== undefined) {
			window.clearTimeout(automaticReplyTimerRef.current);
		}

		automaticReplyTimerRef.current = window.setTimeout(() => {
			automaticReplyTimerRef.current = undefined;
			callback();
		}, AUTOMATIC_REPLY_DELAY);
	};

	const startConversation = () => {
		setMessages([]);
		setStage('typing-email');
		scheduleAutomaticReply(() => {
			setMessages([createMessage('received', 'Olá! Antes de começarmos, qual é o seu e-mail?')]);
			setStage('email');
		});
	};

	const submitEmail = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const normalizedEmail = email.trim().toLowerCase();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
			setEmailError('Informe um e-mail válido para continuar.');
			return;
		}

		setMessages(current => [...current, createMessage('sent', normalizedEmail)]);
		setEmailError('');
		setStage('typing-chat');
		scheduleAutomaticReply(() => {
			setMessages(current => [
				...current,
				createMessage('received', 'Perfeito! Agora conte como podemos ajudar você.')
			]);
			setStage('chat');
		});
	};

	const sendMessage = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const text = message.trim();

		if (!text) return;

		setMessages(current => [...current, createMessage('sent', text)]);
		setMessage('');
	};

	const closeWidget = () => {
		if (window.parent === window) return;

		window.parent.postMessage(
			{
				type: 'wppsync:widget-close',
				integrationId
			},
			'*'
		);
	};

	return (
		<main
			className="flex h-dvh min-h-105 w-full min-w-0 bg-white text-slate-900 dark:bg-[#0e181e] dark:text-slate-100"
			data-integration-id={integrationId}
			data-socket-state={socketConnectionState}
			data-workspace-uid={workspaceUid}>
			<section
				aria-label={`Chat com ${title}`}
				className="grid min-h-0 w-full grid-rows-[4.5rem_minmax(0,1fr)_auto] overflow-hidden bg-white dark:bg-[#0e181e]">
				<header className="flex min-w-0 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-[#223138] dark:bg-[#0e181e]">
					{photo ? (
						<img className="size-10 rounded-full object-cover" src={photo} alt="" />
					) : (
						<span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
							{initials}
						</span>
					)}

					<div className="min-w-0 flex-1">
						<strong className="block truncate text-sm">{title}</strong>
						<span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-brand-700 dark:text-brand-400">
							<i className="size-1.5 rounded-full bg-brand-500" aria-hidden="true" /> Online agora
						</span>
					</div>

					{mode === 'bubble' && (
						<Button
							theme="ghost"
							type="button"
							className="icon-button"
							aria-label="Fechar conversa"
							onClick={closeWidget}>
							<MdClose aria-hidden="true" />
						</Button>
					)}
				</header>

				<div
					ref={messageListRef}
					className="widget-chat-pattern flex min-h-0 flex-col overflow-y-auto px-4 py-5 scrollbar-thin"
					aria-live="polite">
					{stage === 'welcome' ? (
						<div className="m-auto flex max-w-80 flex-col items-center px-4 py-8 text-center">
							<span className="grid size-14 place-items-center rounded-2xl bg-brand-100 text-brand-700 shadow-sm dark:bg-brand-500/15 dark:text-brand-400">
								<MdChatBubbleOutline className="size-7" aria-hidden="true" />
							</span>
							<h1 className="mt-4 text-lg font-bold">Como podemos ajudar?</h1>
							<p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
								Inicie uma conversa com nossa equipe. Normalmente respondemos em poucos minutos.
							</p>
							<Button type="button" className="mt-5 min-w-44" onClick={startConversation}>
								Iniciar conversa <MdArrowForward className="size-4" aria-hidden="true" />
							</Button>
							<span className="mt-5 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
								Atendimento por WppSync
							</span>
						</div>
					) : (
						<>
							<div className="flex justify-center pb-4">
								<span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm dark:border-[#223138] dark:bg-[#0e181e]/90 dark:text-slate-400">
									Hoje
								</span>
							</div>

							<div className="flex flex-col gap-3">
								{messages.map(item => {
									const sent = item.direction === 'sent';

									return (
										<article
											key={item.id}
											className={
												sent
													? 'max-w-[84%] self-end rounded-xl rounded-tr bg-[#d9fdd3] px-3 py-2.5 shadow-sm dark:bg-[#0d5231]'
													: 'max-w-[84%] self-start rounded-xl rounded-tl bg-white px-3 py-2.5 shadow-sm dark:bg-[#18242b]'
											}>
											<p className="wrap-break-word text-[13px] leading-5">{item.text}</p>
											<time className="mt-1 flex items-center justify-end gap-0.5 text-[9px] text-slate-400">
												{item.time}
												{sent && <MdDoneAll className="text-sky-500" aria-label="Enviada" />}
											</time>
										</article>
									);
								})}

								{isTyping && (
									<div
										className="flex w-fit items-center gap-1 self-start rounded-xl rounded-tl bg-white px-3.5 py-3 shadow-sm dark:bg-[#18242b]"
										role="status"
										aria-label="Atendente digitando">
										<span className="widget-typing-dot" aria-hidden="true" />
										<span className="widget-typing-dot" aria-hidden="true" />
										<span className="widget-typing-dot" aria-hidden="true" />
									</div>
								)}
							</div>
						</>
					)}
				</div>

				{stage === 'email' && (
					<form
						className="border-t border-slate-200 bg-white p-3 dark:border-[#223138] dark:bg-[#0e181e]"
						onSubmit={submitEmail}>
						<label className="sr-only" htmlFor="widget-email">
							Seu e-mail
						</label>
						<div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-brand-500 focus-within:bg-white dark:border-[#223138] dark:bg-[#131f26] dark:focus-within:bg-[#0e181e]">
							<MdEmail className="ml-2 size-5 text-slate-400" aria-hidden="true" />
							<input
								ref={emailInputRef}
								id="widget-email"
								type="email"
								value={email}
								placeholder="voce@exemplo.com"
								autoComplete="email"
								className="h-10 min-w-0 bg-transparent px-1 text-sm outline-none placeholder:text-slate-400"
								onChange={event => {
									setEmail(event.target.value);
									setEmailError('');
								}}
							/>
							<Button
								type="submit"
								className="size-10 min-h-10 rounded-lg p-0"
								aria-label="Confirmar e-mail">
								<MdArrowForward className="size-5" aria-hidden="true" />
							</Button>
						</div>
						{emailError && (
							<p className="mt-2 px-1 text-xs font-medium text-red-600 dark:text-red-400">{emailError}</p>
						)}
					</form>
				)}

				{stage === 'chat' && (
					<form
						className="grid min-h-17 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-slate-200 bg-white p-3 dark:border-[#223138] dark:bg-[#0e181e]"
						onSubmit={sendMessage}>
						<label className="sr-only" htmlFor="widget-message">
							Mensagem
						</label>
						<input
							ref={messageInputRef}
							id="widget-message"
							type="text"
							value={message}
							placeholder="Digite uma mensagem..."
							autoComplete="off"
							className="h-11 min-w-0 rounded-xl border border-transparent bg-slate-100 px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white dark:bg-[#131f26] dark:focus:bg-[#0e181e]"
							onChange={event => setMessage(event.target.value)}
						/>
						<Button type="submit" className="size-11 min-h-11 rounded-xl p-0" aria-label="Enviar mensagem">
							<MdSend className="size-5" aria-hidden="true" />
						</Button>
					</form>
				)}
			</section>
		</main>
	);
};

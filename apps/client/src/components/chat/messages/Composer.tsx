import type { Categories, CategoryConfig, EmojiClickData, EmojiStyle, SuggestionMode, Theme } from 'emoji-picker-react';
import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ClipboardEvent, DragEvent, FormEvent } from 'react';
import { MdAttachFile, MdClose, MdEmojiEmotions, MdInsertDriveFile, MdSend } from 'react-icons/md';

import { Button } from '@/components/buttons';
import { useInterfaceStore } from '@/components/interface/store';

import type { MessageSendInput } from '../types';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 55 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 1000;

const EmojiPicker = lazy(() => import('emoji-picker-react'));

const EMOJI_CATEGORIES: CategoryConfig[] = [
	{ category: 'suggested' as Categories, name: 'Recentes' },
	{ category: 'smileys_people' as Categories, name: 'Emoções e pessoas' },
	{ category: 'animals_nature' as Categories, name: 'Animais e natureza' },
	{ category: 'food_drink' as Categories, name: 'Comidas e bebidas' },
	{ category: 'travel_places' as Categories, name: 'Viagens e lugares' },
	{ category: 'activities' as Categories, name: 'Atividades' },
	{ category: 'objects' as Categories, name: 'Objetos' },
	{ category: 'symbols' as Categories, name: 'Símbolos' },
	{ category: 'flags' as Categories, name: 'Bandeiras' }
];

const EMOJI_PICKER_CLASSES = [
	'!rounded-xl !border-0 !shadow-none',
	'![--epr-bg-color:#ffffff] ![--epr-category-label-bg-color:#ffffffeb]',
	'![--epr-category-icon-active-color:#18b956] ![--epr-focus-bg-color:#d0f6de]',
	'![--epr-highlight-color:#18b956] ![--epr-hover-bg-color:#e8fbef]',
	'![--epr-picker-border-color:#e2e8f0] ![--epr-search-input-bg-color:#f1f5f9]',
	'![--epr-text-color:#475569]',
	'dark:![--epr-bg-color:#131f26] dark:![--epr-category-label-bg-color:#131f26eb]',
	'dark:![--epr-category-icon-active-color:#36dc75] dark:![--epr-focus-bg-color:#0e3d2b]',
	'dark:![--epr-highlight-color:#36dc75] dark:![--epr-hover-bg-color:#0f3826]',
	'dark:![--epr-picker-border-color:#2a3a42] dark:![--epr-search-input-bg-color:#0e181e]',
	'dark:![--epr-text-color:#cbd5e1]'
].join(' ');

interface MessageComposerProps {
	disabled?: boolean;
	onSend: (input: MessageSendInput) => void;
}

const formatFileSize = (size: number) => {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`;
	return `${(size / (1024 * 1024)).toFixed(size < 10 * 1024 * 1024 ? 1 : 0)} MB`;
};

const SelectedFile: React.FC<{ file: File; onRemove: () => void }> = ({ file, onRemove }) => {
	const previewUrl = useMemo(() => (file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined), [file]);

	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	return (
		<div className="relative flex min-w-44 max-w-56 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 pr-8 dark:border-[#2a3a42] dark:bg-[#131f26]">
			{previewUrl ? (
				<img src={previewUrl} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
			) : (
				<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-200 text-slate-500 dark:bg-[#223138] dark:text-slate-300">
					<MdInsertDriveFile className="size-5" aria-hidden="true" />
				</span>
			)}
			<span className="min-w-0">
				<strong className="block truncate text-xs font-semibold">{file.name}</strong>
				<small className="text-[10px] text-slate-500 dark:text-slate-400">{formatFileSize(file.size)}</small>
			</span>
			<button
				type="button"
				onClick={onRemove}
				aria-label={`Remover ${file.name}`}
				className="absolute right-1.5 top-1.5 grid size-5 cursor-pointer place-items-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-[#2a3a42] dark:hover:text-white">
				<MdClose aria-hidden="true" />
			</button>
		</div>
	);
};

export const MessageComposer: React.FC<MessageComposerProps> = ({ disabled, onSend }) => {
	const [message, setMessage] = useState('');
	const [files, setFiles] = useState<File[]>([]);
	const [filesError, setFilesError] = useState('');
	const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
	const theme = useInterfaceStore(state => state.theme);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const messageInputRef = useRef<HTMLInputElement>(null);
	const emojiButtonRef = useRef<HTMLDivElement>(null);
	const emojiPopoverRef = useRef<HTMLDivElement>(null);
	const messageSelectionRef = useRef({ start: 0, end: 0 });
	const fileInputId = useId();
	const emojiPickerId = useId();

	useEffect(() => {
		if (!emojiPickerOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target as Node;
			if (emojiButtonRef.current?.contains(target) || emojiPopoverRef.current?.contains(target)) return;
			setEmojiPickerOpen(false);
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			setEmojiPickerOpen(false);
			messageInputRef.current?.focus();
		};

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [emojiPickerOpen]);

	useEffect(() => {
		if (disabled) setEmojiPickerOpen(false);
	}, [disabled]);

	const addFiles = (incomingFiles: File[]) => {
		const oversizedFile = incomingFiles.find(file => file.size > MAX_FILE_SIZE);
		if (oversizedFile) {
			setFilesError(`O arquivo ${oversizedFile.name} ultrapassa o limite de 55 MB.`);
			return;
		}

		const nextFiles = [...files];
		const knownFiles = new Set(files.map(file => `${file.name}:${file.size}:${file.lastModified}`));

		for (const file of incomingFiles) {
			const key = `${file.name}:${file.size}:${file.lastModified}`;
			if (!knownFiles.has(key)) {
				nextFiles.push(file);
				knownFiles.add(key);
			}
		}

		if (nextFiles.length > MAX_FILES) {
			setFilesError(`Você pode enviar no máximo ${MAX_FILES} arquivos por vez.`);
			return;
		}

		setFilesError('');
		setFiles(nextFiles);
	};

	const removeFile = (index: number) => {
		setFiles(current => current.filter((_, fileIndex) => fileIndex !== index));
		setFilesError('');
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		addFiles(Array.from(event.target.files || []));
		event.target.value = '';
	};

	const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
		const pastedFiles = Array.from(event.clipboardData.files);
		if (pastedFiles.length === 0) return;
		event.preventDefault();
		addFiles(pastedFiles);
	};

	const handleDrop = (event: DragEvent<HTMLFormElement>) => {
		event.preventDefault();
		addFiles(Array.from(event.dataTransfer.files));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const text = message.trim();

		if (!text && files.length === 0) return;
		onSend({ text, files });
		setMessage('');
		messageSelectionRef.current = { start: 0, end: 0 };
		setFiles([]);
		setFilesError('');
		setEmojiPickerOpen(false);
	};

	const rememberMessageSelection = () => {
		const input = messageInputRef.current;
		messageSelectionRef.current = {
			start: input?.selectionStart ?? message.length,
			end: input?.selectionEnd ?? message.length
		};
	};

	const toggleEmojiPicker = () => {
		setEmojiPickerOpen(current => !current);
	};

	const handleEmojiClick = (emojiData: EmojiClickData) => {
		const { start, end } = messageSelectionRef.current;
		const nextMessage = `${message.slice(0, start)}${emojiData.emoji}${message.slice(end)}`;
		if (nextMessage.length > MAX_MESSAGE_LENGTH) return;

		const nextCursorPosition = start + emojiData.emoji.length;
		messageSelectionRef.current = { start: nextCursorPosition, end: nextCursorPosition };
		setMessage(nextMessage);

		requestAnimationFrame(() => {
			messageInputRef.current?.focus();
			messageInputRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
		});
	};

	return (
		<form
			className="relative flex min-h-16 flex-col border-t border-slate-200 bg-white p-2 dark:border-[#223138] dark:bg-[#0e181e] mobile:min-h-17.5 mobile:px-3.5 mobile:py-2.5"
			onSubmit={handleSubmit}
			onDragOver={event => event.preventDefault()}
			onDrop={handleDrop}>
			{emojiPickerOpen && (
				<div
					ref={emojiPopoverRef}
					id={emojiPickerId}
					role="dialog"
					aria-label="Seletor de emojis"
					className="absolute bottom-[calc(100%+0.5rem)] left-2 z-50 rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_18px_45px_rgba(15,23,42,0.18)] dark:border-[#2a3a42] dark:bg-[#131f26] dark:shadow-[0_18px_50px_rgba(0,0,0,0.42)] mobile:left-3.5">
					<Suspense
						fallback={
							<div className="grid h-96 w-[min(350px,calc(100vw-28px))] place-items-center rounded-xl bg-white text-sm text-slate-500 dark:bg-[#131f26] dark:text-slate-400">
								Carregando emojis...
							</div>
						}>
						<EmojiPicker
							theme={theme as Theme}
							emojiStyle={'native' as EmojiStyle}
							onEmojiClick={handleEmojiClick}
							categories={EMOJI_CATEGORIES}
							searchPlaceholder="Buscar emoji"
							searchClearButtonLabel="Limpar busca"
							suggestedEmojisMode={'recent' as SuggestionMode}
							previewConfig={{ showPreview: false }}
							lazyLoadEmojis
							width="min(350px, calc(100vw - 28px))"
							height="min(420px, calc(100dvh - 190px))"
							className={EMOJI_PICKER_CLASSES}
						/>
					</Suspense>
				</div>
			)}

			{files.length > 0 && (
				<div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-thin" aria-label="Arquivos selecionados">
					{files.map((file, index) => (
						<SelectedFile
							key={`${file.name}-${file.size}-${file.lastModified}`}
							file={file}
							onRemove={() => removeFile(index)}
						/>
					))}
				</div>
			)}

			{filesError && (
				<p id={`${fileInputId}-error`} className="mb-1.5 px-1 text-xs text-red-500" role="alert">
					{filesError}
				</p>
			)}

			<div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-0.5">
				<div ref={emojiButtonRef}>
					<Button
						theme="ghost"
						type="button"
						aria-label={emojiPickerOpen ? 'Fechar seletor de emojis' : 'Abrir seletor de emojis'}
						aria-haspopup="dialog"
						aria-expanded={emojiPickerOpen}
						aria-controls={emojiPickerOpen ? emojiPickerId : undefined}
						className={`icon-button ${
							emojiPickerOpen ? 'bg-brand-50 text-brand-700 dark:bg-[#0f3826] dark:text-brand-400' : ''
						}`}
						disabled={disabled}
						onPointerDown={rememberMessageSelection}
						onClick={toggleEmojiPicker}>
						<MdEmojiEmotions aria-hidden="true" />
					</Button>
				</div>
				<Button
					theme="ghost"
					type="button"
					aria-label="Anexar arquivo"
					aria-controls={fileInputId}
					className="icon-button"
					disabled={disabled}
					onClick={() => fileInputRef.current?.click()}>
					<MdAttachFile aria-hidden="true" />
				</Button>
				<input
					ref={fileInputRef}
					id={fileInputId}
					type="file"
					multiple
					hidden
					disabled={disabled}
					onChange={handleFileChange}
					aria-describedby={filesError ? `${fileInputId}-error` : undefined}
				/>

				<input
					ref={messageInputRef}
					type="text"
					value={message}
					onChange={event => setMessage(event.target.value)}
					onSelect={rememberMessageSelection}
					onPaste={handlePaste}
					maxLength={MAX_MESSAGE_LENGTH}
					placeholder="Digite uma mensagem..."
					autoComplete="off"
					aria-label="Mensagem"
					disabled={disabled}
					className="h-11 min-w-0 rounded-xl border border-transparent bg-slate-100 px-3.5 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#131f26] dark:focus:bg-[#0e181e]"
				/>

				<Button
					type="submit"
					aria-label="Enviar mensagem"
					disabled={disabled || (!message.trim() && files.length === 0)}
					className="ml-1 size-10.75 min-h-10.75 rounded-xl p-0">
					<MdSend className="size-5.25" aria-hidden="true" />
				</Button>
			</div>
		</form>
	);
};

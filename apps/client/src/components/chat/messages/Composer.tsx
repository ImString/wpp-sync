import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ClipboardEvent, DragEvent, FormEvent } from 'react';
import { MdAttachFile, MdClose, MdEmojiEmotions, MdInsertDriveFile, MdSend } from 'react-icons/md';

import { Button } from '@/components/buttons';

import type { MessageSendInput } from '../types';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 55 * 1024 * 1024;

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
	const fileInputRef = useRef<HTMLInputElement>(null);
	const fileInputId = useId();

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
		setFiles([]);
		setFilesError('');
	};

	return (
		<form
			className="flex min-h-16 flex-col border-t border-slate-200 bg-white p-2 dark:border-[#223138] dark:bg-[#0e181e] mobile:min-h-17.5 mobile:px-3.5 mobile:py-2.5"
			onSubmit={handleSubmit}
			onDragOver={event => event.preventDefault()}
			onDrop={handleDrop}>
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

			<div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-0.5 mobile:grid-cols-[auto_auto_minmax(0,1fr)_auto]">
				<Button theme="ghost" type="button" aria-label="Emoji" className="icon-button hidden mobile:grid">
					<MdEmojiEmotions aria-hidden="true" />
				</Button>
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
					type="text"
					value={message}
					onChange={event => setMessage(event.target.value)}
					onPaste={handlePaste}
					maxLength={1000}
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

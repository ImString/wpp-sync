import { MdAccessTime, MdDone, MdDoneAll, MdError } from 'react-icons/md';

import type { MessageDeliveryState } from '../types';

interface MessageStatusProps extends MessageDeliveryState {
	onRetry?: (requestId: string) => void;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ error, requestId, status, onRetry }) => {
	if (status === 'sending') {
		return <MdAccessTime className="size-3 text-slate-400" aria-label="Enviando" />;
	}

	if (status === 'error') {
		return (
			<button
				type="button"
				aria-label="Falha ao enviar. Tentar novamente"
				title={error || 'Falha ao enviar. Clique para tentar novamente.'}
				disabled={!requestId || !onRetry}
				onClick={() => requestId && onRetry?.(requestId)}
				className="grid size-4 cursor-pointer place-items-center rounded-full text-red-500 transition hover:bg-red-500/10 disabled:cursor-default">
				<MdError className="size-3.5" aria-hidden="true" />
			</button>
		);
	}

	if (status === 'read') return <MdDoneAll className="size-3.5 text-sky-500" aria-label="Lida" />;
	if (status === 'sent') return <MdDone className="size-3.5 text-slate-400" aria-label="Enviada" />;
	return null;
};

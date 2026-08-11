import { useNavigate, useParams } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

import { Button } from '@/components/buttons';
import { ChannelIcon } from '@/components/integrations/ChannelIcon';
import { Image } from '@/components/shared/Image';

import { useChatStore } from '../store';
import type { Conversation } from '../types';

interface ConversationItemProps {
	conversation: Conversation;
}

export const ConversationItem: React.FC<ConversationItemProps> = props => {
	const navigate = useNavigate();
	const { chatId, uid } = useParams<{ chatId: string; uid: string }>();
	const selectConversation = useChatStore(state => state.selectConversation);
	const isActive = chatId === props.conversation.id;

	const handleSelect = () => {
		if (!uid) return;

		selectConversation(props.conversation.id);
		navigate(`/w/${uid}/chats/${props.conversation.id}`);
	};

	return (
		<Button
			theme="unstyled"
			type="button"
			className={twMerge('conversation', isActive ? 'conversation-active' : 'conversation-idle')}
			onClick={handleSelect}>
			<span className="relative shrink-0">
				<Image
					className={twMerge(
						'inline-grid w-10 h-10 flex-0 place-items-center rounded-full',
						props.conversation.avatarClassName
					)}
					seed={props.conversation.initials}
					collection="initials"
				/>
				{props.conversation.channel && (
					<ChannelIcon type={props.conversation.channel} badge className="absolute -left-1 -top-1 z-10" />
				)}
			</span>
			<span
				className={twMerge(
					'flex min-w-0 flex-1 flex-col',
					props.conversation.preview ? 'gap-1' : 'justify-center'
				)}>
				<span className="flex min-w-0 items-center gap-2">
					<strong className="min-w-0 flex-1 truncate text-[13px]">
						{props.conversation.displayName || props.conversation.name}
					</strong>
					<time className="shrink-0 text-[9px] text-slate-400">{props.conversation.time}</time>
				</span>
				{props.conversation.preview && (
					<span className="flex min-h-4.5 min-w-0 items-center gap-2">
						<small className="min-w-0 flex-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
							{props.conversation.preview}
						</small>
						{props.conversation.unread && (
							<span className="grid min-w-4.75 place-items-center rounded-full bg-brand-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
								{props.conversation.unread}
							</span>
						)}
					</span>
				)}
			</span>
		</Button>
	);
};

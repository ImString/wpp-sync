import type { Conversation } from '../types';
import { ConversationItem } from './Item';

interface ConversationListProps {
	conversations: Conversation[];
}

export const ConversationList: React.FC<ConversationListProps> = props => {
	return (
		<div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
			{props.conversations.map(conversation => (
				<ConversationItem key={conversation.id} conversation={conversation} />
			))}
		</div>
	);
};

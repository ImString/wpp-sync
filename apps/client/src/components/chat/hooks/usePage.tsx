import { useEffect } from 'react';

export const useChatPage = () => {
	useEffect(() => {
		const previousTitle = document.title;
		document.title = 'Conversas — WppSync';
		document.body.classList.add('chat-page');

		return () => {
			document.title = previousTitle;
			document.body.classList.remove('chat-page');
		};
	}, []);
};

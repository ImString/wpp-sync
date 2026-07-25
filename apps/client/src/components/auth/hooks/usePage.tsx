import { useEffect } from 'react';

export const useAuthPage = (title: string) => {
	useEffect(() => {
		const previousTitle = document.title;
		document.title = `${title} — WppSync`;
		document.body.classList.add('auth-page');

		return () => {
			document.title = previousTitle;
			document.body.classList.remove('auth-page');
		};
	}, [title]);
};

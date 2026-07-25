import { useCallback, useEffect, useRef, useState } from 'react';

export const useAuthToast = () => {
	const [message, setMessage] = useState('');
	const [isVisible, setIsVisible] = useState(false);
	const [variant, setVariant] = useState<'success' | 'error'>('success');
	const timeoutRef = useRef<number | null>(null);

	const showToast = useCallback((nextMessage: string, nextVariant: 'success' | 'error' = 'success') => {
		if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

		setMessage(nextMessage);
		setVariant(nextVariant);
		setIsVisible(true);
		timeoutRef.current = window.setTimeout(() => setIsVisible(false), 2600);
	}, []);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
		};
	}, []);

	return { isVisible, message, showToast, variant };
};

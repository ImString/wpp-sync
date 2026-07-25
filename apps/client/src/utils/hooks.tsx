import { useCallback, useRef, useState } from 'react';

export function useStateRef<T = any>(initialValue: T) {
	const [state, _setState] = useState<T>(initialValue);
	const stateRef = useRef<T>(initialValue);

	const setState = useCallback((value: React.SetStateAction<T>) => {
		const newState = typeof value === 'function' ? (value as Function)(stateRef.current) : value;

		stateRef.current = newState;
		_setState(newState);
	}, []);

	return [state, setState, stateRef] as [T, React.Dispatch<React.SetStateAction<T>>, React.MutableRefObject<T>];
}

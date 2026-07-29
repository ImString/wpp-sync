import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';

export interface RouteManagerRouteProps extends PropsWithChildren {
	title?: string;
	context?: string;
	bodyClassName?: string;
}

const APPLICATION_NAME = 'WppSync';

const createDocumentTitle = (title?: string, context?: string) => {
	const routeTitle = [title, context].filter(Boolean).join(' · ');
	return routeTitle ? `${routeTitle} — ${APPLICATION_NAME}` : APPLICATION_NAME;
};

export const RouteManagerRoute: React.FC<RouteManagerRouteProps> = props => {
	useEffect(() => {
		const previousTitle = document.title;
		document.title = createDocumentTitle(props.title, props.context);

		return () => {
			document.title = previousTitle;
		};
	}, [props.context, props.title]);

	useEffect(() => {
		const bodyClassNames = props.bodyClassName?.split(/\s+/).filter(Boolean) || [];
		if (bodyClassNames.length > 0) document.body.classList.add(...bodyClassNames);

		return () => {
			if (bodyClassNames.length > 0) document.body.classList.remove(...bodyClassNames);
		};
	}, [props.bodyClassName]);

	return props.children;
};


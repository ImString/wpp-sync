const WIDGET_TOKEN_KEY_PREFIX = 'wppsync.widget.conversation-token';

const getWidgetTokenKey = (integrationId: string) => `${WIDGET_TOKEN_KEY_PREFIX}:${encodeURIComponent(integrationId)}`;

export const getWidgetConversationToken = (integrationId: string) => {
	if (!integrationId) return undefined;

	try {
		return window.localStorage.getItem(getWidgetTokenKey(integrationId)) || undefined;
	} catch {
		return undefined;
	}
};

export const saveWidgetConversationToken = (integrationId: string, token: string) => {
	if (!integrationId || !token) return;

	try {
		window.localStorage.setItem(getWidgetTokenKey(integrationId), token);
	} catch {}
};

export const removeWidgetConversationToken = (integrationId: string) => {
	if (!integrationId) return;

	try {
		window.localStorage.removeItem(getWidgetTokenKey(integrationId));
	} catch {}
};

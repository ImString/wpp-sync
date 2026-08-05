import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ChatConversationRoute, ChatEmptyRoute, ChatLayout } from '@/components/chat';
import { AuthenticationMiddleware } from '@/components/middlewares';
import { RouteManagerRoute } from '@/components/routerManager';

import { AuthRoutes } from './routes/auth';

const WorkspacePage = lazy(() => import('@/components/workspaces').then(module => ({ default: module.WorkspacePage })));
const WorkspaceChatRoute = lazy(() =>
	import('@/components/workspaces').then(module => ({ default: module.WorkspaceChatRoute }))
);
const AccountPage = lazy(() => import('@/components/account').then(module => ({ default: module.AccountPage })));
const ContactsLayout = lazy(() => import('@/components/contacts').then(module => ({ default: module.ContactsLayout })));
const ContactsPage = lazy(() => import('@/components/contacts').then(module => ({ default: module.ContactsPage })));
const RelationshipStagesPage = lazy(() =>
	import('@/components/contacts').then(module => ({ default: module.RelationshipStagesPage }))
);
const IntegrationsLayout = lazy(() =>
	import('@/components/integrations').then(module => ({ default: module.IntegrationsLayout }))
);
const IntegrationsPage = lazy(() =>
	import('@/components/integrations').then(module => ({ default: module.IntegrationsPage }))
);

export const RouteList = () => {
	return (
		<Routes>
			<Route
				path="/"
				element={
					<AuthenticationMiddleware onlyLogged>
						<RouteManagerRoute title="Áreas de trabalho" bodyClassName="workspace-page">
							<WorkspacePage />
						</RouteManagerRoute>
					</AuthenticationMiddleware>
				}
			/>
			<Route
				path="/w/:uid"
				element={
					<AuthenticationMiddleware onlyLogged>
						<WorkspaceChatRoute />
					</AuthenticationMiddleware>
				}>
				<Route index element={<Navigate to="chats" replace />} />
				<Route path="chats" element={<ChatLayout />}>
					<Route index element={<ChatEmptyRoute />} />
					<Route path=":chatId" element={<ChatConversationRoute />} />
				</Route>
				<Route path="contacts" element={<ContactsLayout />}>
					<Route path="stages" element={<RelationshipStagesPage />} />
					<Route path=":contactId?" element={<ContactsPage />} />
				</Route>
				<Route path="integrations" element={<IntegrationsLayout />}>
					<Route index element={<IntegrationsPage />} />
				</Route>
			</Route>
			<Route
				path="/w/:uid/settings/:settingsSection?"
				element={
					<AuthenticationMiddleware onlyLogged>
						<AccountPage />
					</AuthenticationMiddleware>
				}
			/>
			<Route
				path="/w/:uid/my-profile"
				element={
					<AuthenticationMiddleware onlyLogged>
						<AccountPage />
					</AuthenticationMiddleware>
				}
			/>
			<Route
				path="/profile"
				element={
					<AuthenticationMiddleware onlyLogged>
						<AccountPage />
					</AuthenticationMiddleware>
				}
			/>
			<Route
				path="/auth/*"
				element={
					<AuthenticationMiddleware onlyNotLogged>
						<AuthRoutes />
					</AuthenticationMiddleware>
				}
			/>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
};

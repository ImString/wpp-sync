import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';

import { RouteList } from './List';

const router = createBrowserRouter(createRoutesFromElements(<Route path="/*" element={<RouteList />} />));

export default router;

export const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

const apiEndpoint = new URL(apiUrl, window.location.origin);
const apiPath = apiEndpoint.pathname.replace(/\/+$/, '');

export const socketUrl = apiEndpoint.origin;
export const socketPath = `${apiPath}/socket.io`;

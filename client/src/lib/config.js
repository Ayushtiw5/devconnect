const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const SERVER_URL = API_URL.replace(/\/api\/v1\/?$/, '');

const config = {
  apiUrl: API_URL,
  serverUrl: SERVER_URL,
  tokenKey: 'devconnect_token',
  userKey: 'devconnect_user',
};

export default config;

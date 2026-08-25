import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)agrismart_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

api.interceptors.request.use((config) => {
  if (config.method !== 'get') {
    config.headers['X-CSRF-Token'] = getCsrfToken();
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Request failed.';
    return Promise.reject(new Error(message));
  }
);

export default api;
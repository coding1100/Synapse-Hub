import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') {
    return config;
  }

  const raw = window.localStorage.getItem('synapsehub.auth');
  if (!raw) {
    return config;
  }

  try {
    const parsed = JSON.parse(raw) as { accessToken?: string };
    if (parsed.accessToken) {
      config.headers.Authorization = `Bearer ${parsed.accessToken}`;
    }
  } catch {
    // Ignore malformed local data.
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error?.response?.status === 401) {
      window.localStorage.removeItem('synapsehub.auth');
      window.localStorage.removeItem('synapsehub.workspaceId');

      const path = window.location.pathname;
      const isAuthRoute = path.startsWith('/login') || path.startsWith('/register');
      if (!isAuthRoute) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

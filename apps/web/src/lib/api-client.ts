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
    const parsed = JSON.parse(raw) as { accessToken?: string; user?: { id?: string } };
    if (parsed.accessToken) {
      config.headers.Authorization = `Bearer ${parsed.accessToken}`;
    }
    if (parsed.user?.id) {
      config.headers['x-user-id'] = parsed.user.id;
    }
  } catch {
    // Ignore malformed local data.
  }

  return config;
});
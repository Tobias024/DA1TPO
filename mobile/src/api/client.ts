import axios from 'axios';
import Constants from 'expo-constants';
import { session } from '@/storage/session';

/**
 * 10.0.2.2 = host machine en el emulador Android.
 * iOS simulador usa localhost. Para device real, setear apiBaseUrl en app.json.
 */
const fallbackBaseUrl = 'http://10.0.2.2:8080/api/v1';
const baseURL =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ?? fallbackBaseUrl;

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Adjunta JWT en cada request si hay sesión activa.
api.interceptors.request.use(async (config) => {
  const token = await session.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → limpiar sesión (refresco automático queda como mejora futura).
api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    if (error.response?.status === 401) {
      await session.clear();
    }
    return Promise.reject(error);
  },
);

import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { session } from '@/storage/session';

const API_PORT = 8080;
const API_PATH = '/api/v1';

/**
 * Resuelve la URL del backend según el entorno:
 *  1. Si hay `extra.apiBaseUrl` explícito, se usa tal cual. Incluye localhost:
 *     en modo cable, `adb reverse` redirige el localhost del celular hacia la PC.
 *  2. En Expo Go / dev sin override: se deriva la IP del server de Metro (`hostUri`),
 *     así el celular físico llega a la PC sin hardcodear la IP por red.
 *  3. Fallback: 10.0.2.2 (emulador Android) o localhost (iOS sim / web).
 */
function resolveBaseUrl(): string {
  const override = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;
  if (override) {
    return override;
  }

  // `hostUri`/`debuggerHost` son campos de runtime (no están en el type ExpoConfig).
  const c = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    expoGoConfig?: { debuggerHost?: string };
  };
  const hostUri = c.expoConfig?.hostUri ?? c.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${API_PORT}${API_PATH}`;
  }

  const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${fallbackHost}:${API_PORT}${API_PATH}`;
}

const baseURL = resolveBaseUrl();

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
      session.notifyUnauthorized(); // fuerza el logout en el context -> vuelve al login
    }
    return Promise.reject(error);
  },
);

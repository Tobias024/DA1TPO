import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  ACCESS: 'sa.accessToken',
  REFRESH: 'sa.refreshToken',
  USER: 'sa.user',
};

export type SessionUser = {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
  documento?: string;
  categoria: string;
  estado?: string;
};

// Handler que se dispara cuando el backend devuelve 401 (token inválido/expirado).
// Lo registra SessionContext para forzar el logout y volver al login.
let unauthorizedHandler: (() => void) | null = null;

export const session = {
  onUnauthorized(cb: () => void) {
    unauthorizedHandler = cb;
  },
  notifyUnauthorized() {
    if (unauthorizedHandler) unauthorizedHandler();
  },
  async save(accessToken: string, refreshToken: string, user: SessionUser) {
    await AsyncStorage.multiSet([
      [K.ACCESS, accessToken],
      [K.REFRESH, refreshToken],
      [K.USER, JSON.stringify(user)],
    ]);
  },
  async clear() {
    await AsyncStorage.multiRemove([K.ACCESS, K.REFRESH, K.USER]);
  },
  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(K.ACCESS);
  },
  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(K.REFRESH);
  },
  async getUser(): Promise<SessionUser | null> {
    const raw = await AsyncStorage.getItem(K.USER);
    return raw ? JSON.parse(raw) : null;
  },
  async isLoggedIn(): Promise<boolean> {
    return (await AsyncStorage.getItem(K.ACCESS)) !== null;
  },
};

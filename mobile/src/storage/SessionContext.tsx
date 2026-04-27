import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { session, type SessionUser } from './session';

type Ctx = {
  user: SessionUser | null;
  loggedIn: boolean;
  bootstrapping: boolean;
  signIn: (accessToken: string, refreshToken: string, user: SessionUser) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: (user: SessionUser) => void;
};

const SessionContext = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      const [token, u] = await Promise.all([session.getAccessToken(), session.getUser()]);
      setLoggedIn(!!token);
      setUser(u);
      // Splash mínimo de 600 ms para que SubastAR alcance a verse.
      setTimeout(() => setBootstrapping(false), 600);
    })();
  }, []);

  const signIn = useCallback(async (accessToken: string, refreshToken: string, u: SessionUser) => {
    await session.save(accessToken, refreshToken, u);
    setUser(u);
    setLoggedIn(true);
  }, []);

  const signOut = useCallback(async () => {
    await session.clear();
    setUser(null);
    setLoggedIn(false);
  }, []);

  const refreshUser = useCallback((u: SessionUser) => setUser(u), []);

  return (
    <SessionContext.Provider value={{ user, loggedIn, bootstrapping, signIn, signOut, refreshUser }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const v = useContext(SessionContext);
  if (!v) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return v;
}

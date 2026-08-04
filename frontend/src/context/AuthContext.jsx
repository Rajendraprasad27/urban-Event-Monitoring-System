import { createContext, useContext, useMemo, useState } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('citymind_token'));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('citymind_user') || 'null'));

  const value = useMemo(() => ({
    token,
    user,
    async login(payload) {
      const result = await authService.login(payload);
      localStorage.setItem('citymind_token', result.access_token);
      localStorage.setItem('citymind_user', JSON.stringify(result.user));
      setToken(result.access_token);
      setUser(result.user);
      return result;
    },
    async register(payload) {
      const result = await authService.register(payload);
      localStorage.setItem('citymind_token', result.access_token);
      localStorage.setItem('citymind_user', JSON.stringify(result.user));
      setToken(result.access_token);
      setUser(result.user);
      return result;
    },
    logout() {
      localStorage.removeItem('citymind_token');
      localStorage.removeItem('citymind_user');
      setToken(null);
      setUser(null);
    },
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

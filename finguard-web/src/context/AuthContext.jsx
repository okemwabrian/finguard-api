import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('finguard_user');
    return saved ? JSON.parse(saved) : null;
  });

  const saveSession = (data) => {
    localStorage.setItem('finguard_token', data.token);
    const userData = {
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      mustChangePassword: data.mustChangePassword,
    };
    localStorage.setItem('finguard_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    return saveSession(data);
  };

  const register = async (fullName, email, password) => {
    const { data } = await api.post('/api/auth/register', { fullName, email, password });
    return saveSession(data);
  };

  const completePasswordChange = (newToken) => {
    localStorage.setItem('finguard_token', newToken);
    const updated = { ...user, mustChangePassword: false };
    localStorage.setItem('finguard_user', JSON.stringify(updated));
    setUser(updated);
  };

  const logout = () => {
    localStorage.removeItem('finguard_token');
    localStorage.removeItem('finguard_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, completePasswordChange, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

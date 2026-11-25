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
      phone: data.phone || '',
      nationalId: data.nationalId || '',
      mustChangePassword: data.mustChangePassword,
    };
    localStorage.setItem('finguard_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const updateUserProfile = (profileData) => {
    const updated = {
      ...user,
      fullName: profileData.fullName ?? user?.fullName,
      phone: profileData.phone ?? user?.phone ?? '',
      nationalId: profileData.nationalId ?? user?.nationalId ?? '',
    };
    localStorage.setItem('finguard_user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  };

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    return saveSession(data);
  };

  const register = async (fullName, email, password, phone = '', nationalId = '') => {
    const { data } = await api.post('/api/auth/register', { fullName, email, password, phone, nationalId });
    return saveSession(data);
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await api.post('/api/auth/google', { credential });
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
    <AuthContext.Provider
      value={{ user, login, register, loginWithGoogle, completePasswordChange, updateUserProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

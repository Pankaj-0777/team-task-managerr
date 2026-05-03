// src/context/AuthContext.jsx
// Global authentication state — stores user info across all pages

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      const parsed = JSON.parse(savedUser);
      const normalizedUser = {
        ...parsed,
        _id: parsed._id || parsed.id,
        id: parsed.id || parsed._id,
      };
      setUser(normalizedUser);
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const login = (userData, tokenData) => {
    const normalizedUser = {
      ...userData,
      _id: userData._id || userData.id,
      id: userData.id || userData._id,
    };
    setUser(normalizedUser);
    setToken(tokenData);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    localStorage.setItem('token', tokenData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
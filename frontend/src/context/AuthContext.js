import { createContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);

  // ---------- login ----------
  const login = (jwt) => {
    localStorage.setItem('token', jwt);
    setToken(jwt);
    try {
      setUser(jwtDecode(jwt));
    } catch {
      setUser(null);
      setToken(null);
    }
  };

  // ---------- logout ----------
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  // ---------- load token on page refresh ----------
  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      setToken(stored);
      try {
        setUser(jwtDecode(stored));
      } catch {
        logout(); // invalid token, wipe it
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

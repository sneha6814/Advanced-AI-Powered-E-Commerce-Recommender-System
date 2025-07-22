// src/utils/auth.js
export const getToken = () => {
  return localStorage.getItem('token');
};

export const isLoggedIn = () => {
  return !!getToken();
};

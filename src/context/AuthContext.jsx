import { createContext, useState, useEffect, useContext, useCallback } from 'react';

const AuthContext = createContext(null);
export const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000'
  : 'https://rent-nest-backend.onrender.com';
const API_URL = `${BASE_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Helper fetch request wrapper that appends JWT token automatically
  // Includes automatic retry logic to handle sleeping Render free tier services gracefully
  const apiFetch = useCallback(async (endpoint, options = {}, retries = 20, delay = 3000) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });

      // Render free tier gateway spin-up errors (502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout)
      if ([502, 503, 504].includes(res.status) && retries > 0) {
        console.warn(`Gateway response ${res.status}. Server might be sleeping. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiFetch(endpoint, options, retries - 1, delay);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'API request failed.');
      }
      return data;
    } catch (err) {
      // If it's a network/connection error (occurs if request is rejected during container boot binding)
      if (retries > 0) {
        console.warn(`Network error: ${err.message}. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiFetch(endpoint, options, retries - 1, delay);
      }
      throw err;
    }
  }, [token]);

  // Helper multipart form request wrapper (for image uploads)
  const apiUpload = useCallback(async (endpoint, formData, method = 'POST') => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Upload failed.');
    }
    return data;
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  }, []);

  // Fetch current user details
  const getProfile = useCallback(async (currentToken) => {
    try {
      const data = await apiFetch('/auth/me', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (data.success) {
        setUser(data.data.user);
      } else {
        // Token invalid or expired
        logout();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      logout();
    } finally {
      setLoading(false);
    }
  }, [apiFetch, logout]);

  useEffect(() => {
    if (token) {
      getProfile(token);
    } else {
      setLoading(false);
    }
  }, [getProfile, token]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('token', data.data.token);
      setToken(data.data.token);
      setUser(data.data.user);
      return data.data.user;
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const signup = useCallback(async (userData) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      localStorage.setItem('token', data.data.token);
      setToken(data.data.token);
      setUser(data.data.user);
      return data.data.user;
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);


  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        apiFetch,
        apiUpload,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

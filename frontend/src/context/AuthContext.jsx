import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(false);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Revalidate a saved session when the app loads.
  useEffect(() => {
    let cancelled = false;

    const rehydrateSession = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) return;

      try {
        const res = await authService.getProfile();

        if (!cancelled && res.success && res.user) {
          setUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      } catch (err) {
        if (cancelled) return;

        // Clear the session if the backend says the token is invalid.
        if (err.response?.status === 401) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    };

    rehydrateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  // Sends the form credentials to the backend login endpoint.
  // The backend reads and checks its own .env/database values.
  const login = async (email, password) => {
    setIsLoading(true);

    try {
      const data = await authService.login({ email, password });

      if (!data.success || !data.user || !data.token) {
        return {
          success: false,
          message: data.message || 'Invalid email or password.',
        };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (err) {
      return {
        success: false,
        message:
          err.response?.data?.message ||
          err.message ||
          'Login failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);

    try {
      const data = await authService.register(userData);

      if (!data.success) {
        return {
          success: false,
          message: data.message || 'Registration failed.',
        };
      }

      if (data.pendingApproval) {
        return {
          success: true,
          pendingApproval: true,
          message: data.message,
        };
      }

      if (data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return { success: true, user: data.user };
    } catch (err) {
      return {
        success: false,
        message:
          err.response?.data?.message ||
          err.message ||
          'Registration failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Clear the local session even if the server cannot be reached.
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    isLoading,
    theme,
    toggleTheme,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
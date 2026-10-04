import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.ts';
import { api } from '../services/api.ts';
import { socketService } from '../services/socket.ts';

function makeAvatar(initials: string, bgHex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="60" fill="${bgHex}"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="600">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string) => Promise<void>;
  register: (username: string, displayName: string, bio?: string) => Promise<void>;
  switchUser: (username: string) => Promise<void>;
  logout: () => void;
  demoUsers: { username: string; name: string; role: string; avatar: string }[];
}

const DEMO_USERS = [
  {
    username: 'maaz_awan',
    name: 'Maaz Awan',
    role: 'Lead Full Stack Engineer',
    avatar: makeAvatar('MA', '#00a884'),
  },
  {
    username: 'sarah_m',
    name: 'Sarah Miller',
    role: 'Product Designer',
    avatar: makeAvatar('SM', '#0284c7'),
  },
  {
    username: 'marcus_v',
    name: 'Marcus Vance',
    role: 'Backend Architect',
    avatar: makeAvatar('MV', '#7c3aed'),
  },
  {
    username: 'elena_rostova',
    name: 'Elena Rostova',
    role: 'Frontend Developer',
    avatar: makeAvatar('ER', '#e11d48'),
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('chat_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const savedToken = localStorage.getItem('chat_token');
      if (savedToken) {
        try {
          const { user } = await api.verifyMe(savedToken);
          setUser(user);
          setToken(savedToken);
          socketService.connect(savedToken);
        } catch {
          await login('maaz_awan');
        }
      } else {
        await login('maaz_awan');
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const login = async (username: string) => {
    try {
      const data = await api.login(username);
      localStorage.setItem('chat_token', data.token);
      setToken(data.token);
      setUser(data.user);
      socketService.connect(data.token);
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const register = async (username: string, displayName: string, bio?: string) => {
    try {
      const data = await api.register(username, displayName, bio);
      localStorage.setItem('chat_token', data.token);
      setToken(data.token);
      setUser(data.user);
      socketService.connect(data.token);
    } catch (err) {
      console.error('Register error:', err);
      throw err;
    }
  };

  const switchUser = async (username: string) => {
    socketService.disconnect();
    await login(username);
  };

  const logout = () => {
    localStorage.removeItem('chat_token');
    socketService.disconnect();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        switchUser,
        logout,
        demoUsers: DEMO_USERS,
      }}
    >
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

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { normalizeUserRole, User, UserRole } from './types';
import * as api from './api';

function normalizeUserPayload(userPayload: any): User {
  const id = String(userPayload?.id ?? userPayload?._id ?? userPayload?.userId ?? '');
  const teamId =
    userPayload?.teamId ??
    userPayload?.team?.id ??
    userPayload?.team?._id ??
    userPayload?.team?.teamId ??
    '';

  return {
    id,
    name: String(userPayload?.name ?? userPayload?.fullName ?? userPayload?.full_name ?? ''),
    email: String(userPayload?.email ?? ''),
    role: normalizeUserRole(userPayload?.role),
    teamId: String(teamId),
    skillLevel: userPayload?.skillLevel,
    avatar: userPayload?.avatar,
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isInitialized: boolean;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_TOKEN = 'taskflow_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_TOKEN);
    if (token) {
      api.setToken(token);
      api
        .getCurrentUser()
        .then((currentUser) => {
          const resolvedUser = currentUser?.data ?? currentUser;
          setUser(normalizeUserPayload(resolvedUser));
        })
        .catch(() => {
          localStorage.removeItem(STORAGE_TOKEN);
          api.setToken(null);
          setUser(null);
        })
        .finally(() => setIsInitialized(true));
    } else {
      setIsInitialized(true);
    }
  }, []);

  const login = async (email: string, password: string, role?: UserRole): Promise<boolean> => {
    setIsLoading(true);
    try {
      const loginPayload: any = { email, password };
      if (role) {
        loginPayload.role = role;
      }

      let response;
      try {
        response = await api.login(loginPayload);
      } catch (err: any) {
        // fallback when role-specific backend check fails
        const msg = err?.message || '';
        if (role && msg.toLowerCase().includes('not registered as')) {
          response = await api.login({ email, password });
        } else {
          throw err;
        }
      }

      console.debug('[auth] login response', response);

      const result: any = response;
      const token = result?.data?.token ?? result?.token;
      const userPayload = result?.data?.user ?? result?.user;

      if (!token || !userPayload) {
        throw new Error('Invalid login response from server. Expected token and user payload.');
      }

      localStorage.setItem(STORAGE_TOKEN, token);
      api.setToken(token);
      setUser(normalizeUserPayload(userPayload));
      setIsLoading(false);
      return true;
    } catch (error: any) {
      const message = error?.message || 'Login failed';
      console.error('Login failed', message);
      setIsLoading(false);
      throw new Error(message);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      await api.register({ fullName: name, email, password, confirmPassword: password });
      const success = await login(email, password, role);
      setIsLoading(false);
      return success;
    } catch (error: any) {
      const message = error?.message || 'Register failed';
      console.error('Register failed', message);
      setIsLoading(false);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_TOKEN);
    api.setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, isInitialized, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

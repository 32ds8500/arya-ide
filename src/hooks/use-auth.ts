'use client';

import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store';
import type { LoginCredentials, RegisterData, User, Session } from '../types';

const SESSION_KEY = ['auth', 'session'];
const USER_KEY = ['auth', 'user'];

async function fetchSession(): Promise<{ user: User; session: Session } | null> {
  try {
    const response = await fetch('/api/auth/get-session');
    if (!response.ok) return null;
    const data = await response.json();
    if (!data?.session) return null;
    return data;
  } catch {
    return null;
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const {
    user,
    session,
    isAuthenticated,
    isLoading: storeLoading,
    error,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    updateProfile,
    clearError,
  } = useAuthStore();

  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: SESSION_KEY,
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !user,
  });

  useEffect(() => {
    if (sessionData) {
      useAuthStore.getState().setUser(sessionData.user);
      useAuthStore.getState().setSession(sessionData.session);
    }
  }, [sessionData]);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => storeLogin(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      queryClient.invalidateQueries({ queryKey: USER_KEY });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => storeRegister(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      queryClient.invalidateQueries({ queryKey: USER_KEY });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => {
      storeLogout();
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: SESSION_KEY });
      queryClient.removeQueries({ queryKey: USER_KEY });
    },
  });

  const login = useCallback(
    (credentials: LoginCredentials) => loginMutation.mutateAsync(credentials),
    [loginMutation]
  );

  const register = useCallback(
    (data: RegisterData) => registerMutation.mutateAsync(data),
    [registerMutation]
  );

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  return {
    user,
    session,
    isAuthenticated,
    isLoading: storeLoading || sessionLoading,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };
}

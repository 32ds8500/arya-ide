import { BaseEntity } from './common';

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface User extends BaseEntity {
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  language: string;
  fontSize: number;
  fontFamily: string;
  keybindings: 'default' | 'vim' | 'emacs';
}

export interface Session extends BaseEntity {
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  deviceInfo: string;
  ipAddress: string;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

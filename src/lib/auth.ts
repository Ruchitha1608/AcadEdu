import { AppUser, AuthSession } from '@/types/student';
import { getUsers, setUsers, setSession, clearSession, getSession, getUserByUsername } from './storage';

async function hashPassword(password: string): Promise<string> {
  if (typeof window === 'undefined') return password;
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(password));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export async function initDefaultUser(): Promise<void> {
  if (typeof window === 'undefined') return;
  const users = getUsers();
  if (users.length === 0) {
    const hash = await hashPassword('acadpulse123');
    const defaultUser: AppUser = {
      id: generateId(),
      username: 'admin',
      passwordHash: hash,
      displayName: 'Admin User',
      createdAt: new Date().toISOString(),
    };
    setUsers([defaultUser]);
  }
}

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  const user = getUserByUsername(username);
  if (!user) return { success: false, error: 'Invalid username or password' };
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return { success: false, error: 'Invalid username or password' };
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const session: AuthSession = {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    loggedInAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
  setSession(session);
  return { success: true };
}

export function logout(): void {
  clearSession();
}

export function getCurrentSession(): AuthSession | null {
  return getSession();
}

export async function register(username: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> {
  const existing = getUserByUsername(username);
  if (existing) return { success: false, error: 'Username already taken' };
  const hash = await hashPassword(password);
  const user: AppUser = {
    id: generateId(),
    username,
    passwordHash: hash,
    displayName,
    createdAt: new Date().toISOString(),
  };
  const users = getUsers();
  setUsers([...users, user]);
  return { success: true };
}

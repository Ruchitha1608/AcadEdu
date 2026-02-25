import { Student, AppUser, AuthSession } from '@/types/student';

const KEYS = {
  USERS: 'acadpulse_users',
  SESSION: 'acadpulse_session',
  STUDENTS: 'acadpulse_students',
} as const;

function safeGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Users
export function getUsers(): AppUser[] {
  return safeGet<AppUser[]>(KEYS.USERS) ?? [];
}
export function setUsers(users: AppUser[]): void {
  safeSet(KEYS.USERS, users);
}
export function getUserByUsername(username: string): AppUser | undefined {
  return getUsers().find((u) => u.username === username);
}
export function addUser(user: AppUser): void {
  setUsers([...getUsers(), user]);
}

// Session
export function getSession(): AuthSession | null {
  const s = safeGet<AuthSession>(KEYS.SESSION);
  if (!s) return null;
  if (new Date(s.expiresAt) < new Date()) {
    clearSession();
    return null;
  }
  return s;
}
export function setSession(session: AuthSession): void {
  safeSet(KEYS.SESSION, session);
}
export function clearSession(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(KEYS.SESSION);
}

// Students
export function getStudents(): Student[] {
  return safeGet<Student[]>(KEYS.STUDENTS) ?? [];
}
export function setStudents(students: Student[]): void {
  safeSet(KEYS.STUDENTS, students);
}
export function getStudentById(id: string): Student | undefined {
  return getStudents().find((s) => s.id === id);
}
export function addStudent(student: Student): void {
  setStudents([...getStudents(), student]);
}
export function updateStudent(updated: Student): void {
  setStudents(getStudents().map((s) => (s.id === updated.id ? updated : s)));
}
export function deleteStudent(id: string): void {
  setStudents(getStudents().filter((s) => s.id !== id));
}

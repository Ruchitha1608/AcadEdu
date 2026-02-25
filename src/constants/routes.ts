export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  STUDENT_NEW: '/students/new',
  STUDENT_DETAIL: (id: string) => `/students/${id}`,
  STUDENT_EDIT: (id: string) => `/students/${id}/edit`,
  COMPARE: '/compare',
  ANALYTICS: '/analytics',
  REPORTS: '/reports',
} as const;

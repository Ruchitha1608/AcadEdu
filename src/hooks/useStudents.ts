'use client';
import { useState, useEffect, useCallback } from 'react';
import { Student } from '@/types/student';
import {
  getStudents, addStudent, updateStudent, deleteStudent, getStudentById,
} from '@/lib/storage';
import { AVATAR_COLORS } from '@/constants/chartColors';

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);

  const refresh = useCallback(() => {
    setStudents(getStudents());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createStudent = useCallback(
    (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor' | 'currentCGPA' | 'currentSemester'>) => {
      const semesters = data.semesters ?? [];
      const currentCGPA = semesters.length > 0 ? semesters[semesters.length - 1].cgpaAfterSemester : 0;
      const student: Student = {
        ...data,
        id: generateId(),
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        currentCGPA,
        currentSemester: semesters.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addStudent(student);
      refresh();
      return student;
    },
    [refresh]
  );

  const editStudent = useCallback(
    (updated: Student) => {
      const semesters = updated.semesters ?? [];
      const currentCGPA = semesters.length > 0 ? semesters[semesters.length - 1].cgpaAfterSemester : 0;
      const final = {
        ...updated,
        currentCGPA,
        currentSemester: semesters.length,
        updatedAt: new Date().toISOString(),
      };
      updateStudent(final);
      refresh();
    },
    [refresh]
  );

  const removeStudent = useCallback(
    (id: string) => {
      deleteStudent(id);
      refresh();
    },
    [refresh]
  );

  const getById = useCallback((id: string) => getStudentById(id), []);

  return { students, createStudent, editStudent, removeStudent, getById, refresh };
}

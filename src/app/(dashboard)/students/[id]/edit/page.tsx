'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStudents } from '@/hooks/useStudents';
import { Student } from '@/types/student';
import ManualEntryForm from '@/components/upload/ManualEntryForm';
import Card from '@/components/ui/Card';

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const { getById, editStudent } = useStudents();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getById(id);
    if (!s) router.replace('/students');
    else setStudent(s);
  }, [id, getById, router]);

  if (!student) return null;

  const handleSubmit = (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor' | 'currentCGPA' | 'currentSemester'>) => {
    setLoading(true);
    editStudent({ ...student, ...data });
    router.push(`/students/${student.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card title={`Edit — ${student.name}`} subtitle="Update student academic data">
        <ManualEntryForm initial={student} onSubmit={handleSubmit} loading={loading} />
      </Card>
    </div>
  );
}

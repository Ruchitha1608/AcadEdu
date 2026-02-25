'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudents } from '@/hooks/useStudents';
import { Student } from '@/types/student';
import ManualEntryForm from '@/components/upload/ManualEntryForm';
import FileUploadZone from '@/components/upload/FileUploadZone';
import Card from '@/components/ui/Card';

type Mode = 'upload' | 'manual';

export default function NewStudentPage() {
  const [mode, setMode] = useState<Mode>('upload');
  const [prefill, setPrefill] = useState<Partial<Student> | null>(null);
  const [loading, setLoading] = useState(false);
  const { createStudent } = useStudents();
  const router = useRouter();

  const handleExtracted = (data: Partial<Student>) => {
    setPrefill(data);
    setMode('manual');
  };

  const handleSubmit = (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor' | 'currentCGPA' | 'currentSemester'>) => {
    setLoading(true);
    const student = createStudent(data);
    router.push(`/students/${student.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          {(['upload', 'manual'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {m === 'upload' ? '📎 Upload File (AI)' : '✏️ Manual Entry'}
            </button>
          ))}
        </div>

        {mode === 'upload' && !prefill && (
          <FileUploadZone onExtracted={handleExtracted} onManualMode={() => setMode('manual')} />
        )}

        {(mode === 'manual' || prefill) && (
          <>
            {prefill && (
              <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl">
                <p className="text-xs text-green-700 font-medium">AI extracted data — review and edit before saving</p>
              </div>
            )}
            <ManualEntryForm initial={prefill ?? undefined} onSubmit={handleSubmit} loading={loading} />
          </>
        )}
      </Card>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { Student } from '@/types/student';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { cgpaBadgeColor } from '@/constants/gradePoints';
import { ROUTES } from '@/constants/routes';

interface Props {
  student: Student;
  onDelete?: (id: string) => void;
}

export default function StudentCard({ student, onDelete }: Props) {
  const cgpaBadge = cgpaBadgeColor(student.currentCGPA);
  const avgAttendance = student.semesters.length
    ? Math.round(student.semesters.reduce((acc, s) => acc + s.overallAttendance, 0) / student.semesters.length)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar name={student.name} color={student.avatarColor} size="lg" />
            <div>
              <Link href={ROUTES.STUDENT_DETAIL(student.id)} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                {student.name}
              </Link>
              <p className="text-xs text-gray-500">{student.rollNumber}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold border ${cgpaBadge}`}>
            {student.currentCGPA.toFixed(2)}
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {student.department}
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {student.program} · {student.batch}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Badge color={avgAttendance >= 85 ? 'green' : avgAttendance >= 75 ? 'yellow' : 'red'}>
            {avgAttendance}% Attendance
          </Badge>
          <Badge color="gray">Sem {student.currentSemester}</Badge>
          {student.aiInsights && (
            <Badge color="indigo">{student.aiInsights.consistencyScore}/100</Badge>
          )}
        </div>
      </div>

      <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
        <Link href={ROUTES.STUDENT_DETAIL(student.id)} className="text-xs text-indigo-600 font-medium hover:text-indigo-700">
          View Profile →
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(student.id)}
            className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

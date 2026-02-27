'use client';
import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useStudents } from '@/hooks/useStudents';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { cgpaBadgeColor } from '@/constants/gradePoints';
import { buildCGPATrend } from '@/lib/chartTransformers';
import CGPATrendChart from '@/components/charts/CGPATrendChart';
import { DEMO_STUDENTS } from '@/lib/demoData';
import { setStudents } from '@/lib/storage';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl p-5 border ${color}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { students, refresh } = useStudents();
  const [demoLoaded, setDemoLoaded] = useState(false);

  const loadDemo = useCallback(() => {
    // Merge: keep existing non-demo students, replace demo ones fresh
    const existing = students.filter((s) => !s.id.startsWith('demo-student-'));
    setStudents([...existing, ...DEMO_STUDENTS]);
    refresh();
    setDemoLoaded(true);
  }, [students, refresh]);

  const clearDemo = useCallback(() => {
    const existing = students.filter((s) => !s.id.startsWith('demo-student-'));
    setStudents(existing);
    refresh();
    setDemoLoaded(false);
  }, [students, refresh]);

  const hasDemoLoaded = students.some((s) => s.id.startsWith('demo-student-'));

  const stats = useMemo(() => {
    if (!students.length) return null;
    const avgCGPA = students.reduce((acc, s) => acc + s.currentCGPA, 0) / students.length;
    const best = [...students].sort((a, b) => b.currentCGPA - a.currentCGPA)[0];
    const lowAttendance = students.filter((s) => {
      const avg = s.semesters.length ? s.semesters.reduce((acc, sem) => acc + sem.overallAttendance, 0) / s.semesters.length : 100;
      return avg < 75;
    }).length;
    return { avgCGPA, best, lowAttendance };
  }, [students]);

  const recentStudents = useMemo(() =>
    [...students].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5),
    [students]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Demo Banner */}
      {!hasDemoLoaded ? (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-indigo-800">Try with demo data</p>
            <p className="text-xs text-indigo-500 mt-0.5">
              3 students · Arjun Sharma (CSE, CGPA 8.87), Priya Nair (ECE, 7.65), Ravi Kumar (IT, 6.42)
            </p>
          </div>
          <button
            onClick={loadDemo}
            className="ml-4 shrink-0 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Load Demo Data
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4">
          <p className="text-sm font-medium text-emerald-700">
            Demo data loaded — Arjun, Priya &amp; Ravi are ready to explore
          </p>
          <button
            onClick={clearDemo}
            className="ml-4 shrink-0 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl hover:bg-emerald-50 transition-colors"
          >
            Clear Demo
          </button>
        </div>
      )}
      {demoLoaded && !hasDemoLoaded && null /* reset local flag after clear */}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={students.length} sub="tracked profiles" color="bg-indigo-50 border-indigo-100 text-indigo-700" />
        <StatCard label="Average CGPA" value={stats ? stats.avgCGPA.toFixed(2) : '—'} sub="across all students" color="bg-emerald-50 border-emerald-100 text-emerald-700" />
        <StatCard label="Top Performer" value={stats?.best?.name.split(' ')[0] ?? '—'} sub={stats ? `CGPA ${stats.best.currentCGPA.toFixed(2)}` : ''} color="bg-amber-50 border-amber-100 text-amber-700" />
        <StatCard label="Low Attendance" value={stats?.lowAttendance ?? 0} sub="students below 75%" color="bg-red-50 border-red-100 text-red-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CGPA Overview Chart */}
        <div className="lg:col-span-2">
          <Card title="CGPA Trends Overview" subtitle="All students across semesters">
            {students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <svg className="h-12 w-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">No students yet</p>
                <Link href="/students/new" className="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-700">Add your first student →</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentStudents.slice(0, 3).map((s) => (
                  <div key={s.id} className="border border-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={s.name} color={s.avatarColor} size="sm" />
                      <span className="text-xs font-medium text-gray-700">{s.name}</span>
                      <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border ${cgpaBadgeColor(s.currentCGPA)}`}>
                        {s.currentCGPA.toFixed(2)}
                      </span>
                    </div>
                    <CGPATrendChart data={buildCGPATrend(s.semesters, false)} height={90} compact />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Students */}
        <div>
          <Card title="Recent Students" actions={<Link href="/students" className="text-xs text-indigo-600 font-medium">View all</Link>}>
            {recentStudents.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No students added yet</div>
            ) : (
              <div className="space-y-3">
                {recentStudents.map((s) => (
                  <Link key={s.id} href={`/students/${s.id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                    <Avatar name={s.name} color={s.avatarColor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-600">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.department}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cgpaBadgeColor(s.currentCGPA)}`}>
                      {s.currentCGPA.toFixed(2)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/students/new', label: 'Add Student', icon: '➕', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
            { href: '/compare', label: 'Compare', icon: '⚖️', color: 'bg-amber-50 text-amber-700 border-amber-100' },
            { href: '/analytics', label: 'Analytics', icon: '📊', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
            { href: '/reports', label: 'Reports', icon: '📄', color: 'bg-purple-50 text-purple-700 border-purple-100' },
          ].map((a) => (
            <Link key={a.href} href={a.href} className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center hover:opacity-80 transition-opacity ${a.color}`}>
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-medium">{a.label}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

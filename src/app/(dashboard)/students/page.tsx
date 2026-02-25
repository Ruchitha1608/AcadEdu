'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStudents } from '@/hooks/useStudents';
import StudentCard from '@/components/student/StudentCard';
import Button from '@/components/ui/Button';

export default function StudentsPage() {
  const { students, removeStudent } = useStudents();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'name' | 'cgpa_desc' | 'cgpa_asc' | 'recent'>('recent');
  const [dept, setDept] = useState('All');

  const departments = useMemo(() => {
    const depts = [...new Set(students.map((s) => s.department))].filter(Boolean);
    return ['All', ...depts];
  }, [students]);

  const filtered = useMemo(() => {
    let list = students;
    if (search) list = list.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase())
    );
    if (dept !== 'All') list = list.filter((s) => s.department === dept);
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'cgpa_desc') list = [...list].sort((a, b) => b.currentCGPA - a.currentCGPA);
    if (sort === 'cgpa_asc') list = [...list].sort((a, b) => a.currentCGPA - b.currentCGPA);
    if (sort === 'recent') list = [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }, [students, search, sort, dept]);

  const confirmDelete = (id: string) => {
    const s = students.find((s) => s.id === id);
    if (window.confirm(`Delete ${s?.name}? This cannot be undone.`)) removeStudent(id);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or roll number..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          />
        </div>

        <select value={dept} onChange={(e) => setDept(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="recent">Most Recent</option>
          <option value="cgpa_desc">CGPA (High → Low)</option>
          <option value="cgpa_asc">CGPA (Low → High)</option>
          <option value="name">Name (A → Z)</option>
        </select>

        <Link href="/students/new">
          <Button icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
            Add Student
          </Button>
        </Link>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">{students.length === 0 ? 'No students added yet.' : 'No students match your search.'}</p>
          {students.length === 0 && (
            <Link href="/students/new" className="mt-3 inline-block text-sm text-indigo-600 font-medium hover:text-indigo-700">
              Add your first student →
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((s) => <StudentCard key={s.id} student={s} onDelete={confirmDelete} />)}
          </div>
        </>
      )}
    </div>
  );
}

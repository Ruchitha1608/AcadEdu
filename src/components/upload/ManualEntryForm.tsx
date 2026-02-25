'use client';
import { useState } from 'react';
import { Student, Semester, Subject } from '@/types/student';
import Button from '@/components/ui/Button';
import { gradeToPoint } from '@/constants/gradePoints';

interface Props {
  initial?: Partial<Student>;
  onSubmit: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor' | 'currentCGPA' | 'currentSemester'>) => void;
  loading?: boolean;
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function newSubject(): Subject {
  return { id: genId(), code: '', name: '', credits: 3, grade: 'O', gradePoint: 10, attendancePercentage: 85 };
}

function newSemester(num: number): Semester {
  return {
    id: genId(),
    semesterNumber: num,
    academicYear: '',
    sgpa: 0,
    cgpaAfterSemester: 0,
    totalCredits: 0,
    earnedCredits: 0,
    subjects: [newSubject()],
    attendance: [],
    overallAttendance: 85,
    backlogs: 0,
  };
}

function computeSGPA(subjects: Subject[]): number {
  const total = subjects.reduce((acc, s) => acc + s.credits, 0);
  if (!total) return 0;
  const weighted = subjects.reduce((acc, s) => acc + s.gradePoint * s.credits, 0);
  return parseFloat((weighted / total).toFixed(2));
}

function computeCGPA(semesters: Semester[]): Semester[] {
  let cumCred = 0;
  let cumWeighted = 0;
  return semesters.map((sem) => {
    cumCred += sem.totalCredits;
    cumWeighted += sem.sgpa * sem.totalCredits;
    return { ...sem, cgpaAfterSemester: cumCred > 0 ? parseFloat((cumWeighted / cumCred).toFixed(2)) : 0 };
  });
}

export default function ManualEntryForm({ initial, onSubmit, loading = false }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [rollNumber, setRollNumber] = useState(initial?.rollNumber ?? '');
  const [department, setDepartment] = useState(initial?.department ?? '');
  const [program, setProgram] = useState(initial?.program ?? 'B.Tech');
  const [batch, setBatch] = useState(initial?.batch ?? '');
  const [university, setUniversity] = useState(initial?.university ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [semesters, setSemesters] = useState<Semester[]>(initial?.semesters?.length ? initial.semesters : [newSemester(1)]);

  const updateSemester = (idx: number, key: keyof Semester, value: unknown) => {
    setSemesters((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [key]: value };
      return updated;
    });
  };

  const updateSubject = (semIdx: number, subIdx: number, key: keyof Subject, value: unknown) => {
    setSemesters((prev) => {
      const updated = [...prev];
      const subjects = [...updated[semIdx].subjects];
      subjects[subIdx] = { ...subjects[subIdx], [key]: value };
      if (key === 'grade') {
        subjects[subIdx].gradePoint = gradeToPoint(value as string);
      }
      const sgpa = computeSGPA(subjects);
      const backlogs = subjects.filter((s) => s.gradePoint === 0).length;
      const totalCredits = subjects.reduce((acc, s) => acc + s.credits, 0);
      updated[semIdx] = { ...updated[semIdx], subjects, sgpa, backlogs, totalCredits, earnedCredits: totalCredits - backlogs * 3 };
      return computeCGPA(updated);
    });
  };

  const addSemester = () => setSemesters((prev) => [...prev, newSemester(prev.length + 1)]);
  const removeSemester = (idx: number) => setSemesters((prev) => prev.filter((_, i) => i !== idx));
  const addSubject = (semIdx: number) => {
    setSemesters((prev) => {
      const updated = [...prev];
      updated[semIdx] = { ...updated[semIdx], subjects: [...updated[semIdx].subjects, newSubject()] };
      return updated;
    });
  };
  const removeSubject = (semIdx: number, subIdx: number) => {
    setSemesters((prev) => {
      const updated = [...prev];
      const subjects = updated[semIdx].subjects.filter((_, i) => i !== subIdx);
      const sgpa = computeSGPA(subjects);
      const backlogs = subjects.filter((s) => s.gradePoint === 0).length;
      const totalCredits = subjects.reduce((acc, s) => acc + s.credits, 0);
      updated[semIdx] = { ...updated[semIdx], subjects, sgpa, backlogs, totalCredits };
      return computeCGPA(updated);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, rollNumber, department, program, batch, university, email, semesters });
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  const GRADES = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F', 'Ab'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Full Name *</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Arjun Kumar" />
          </div>
          <div>
            <label className={labelCls}>Roll Number *</label>
            <input className={inputCls} value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required placeholder="21CS001" />
          </div>
          <div>
            <label className={labelCls}>Department *</label>
            <input className={inputCls} value={department} onChange={(e) => setDepartment(e.target.value)} required placeholder="Computer Science" />
          </div>
          <div>
            <label className={labelCls}>Program</label>
            <select className={inputCls} value={program} onChange={(e) => setProgram(e.target.value)}>
              {['B.Tech', 'B.E.', 'B.Sc', 'M.Tech', 'MBA', 'MCA', 'B.Com', 'BCA'].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Batch (e.g., 2021-2025)</label>
            <input className={inputCls} value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="2021-2025" />
          </div>
          <div>
            <label className={labelCls}>University</label>
            <input className={inputCls} value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Anna University" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Email (optional)</label>
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@email.com" />
          </div>
        </div>
      </div>

      {/* Semesters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Academic Records</h3>
          <Button type="button" variant="outline" size="sm" onClick={addSemester}>+ Add Semester</Button>
        </div>
        <div className="space-y-4">
          {semesters.map((sem, semIdx) => (
            <div key={sem.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-800">Semester {sem.semesterNumber}</h4>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>SGPA: <strong className="text-indigo-600">{sem.sgpa.toFixed(2)}</strong></span>
                  <span>CGPA: <strong className="text-emerald-600">{sem.cgpaAfterSemester.toFixed(2)}</strong></span>
                  {semesters.length > 1 && (
                    <button type="button" onClick={() => removeSemester(semIdx)} className="text-red-500 hover:text-red-700">
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <label className={labelCls}>Academic Year</label>
                  <input className={inputCls} value={sem.academicYear} onChange={(e) => updateSemester(semIdx, 'academicYear', e.target.value)} placeholder="2023-24" />
                </div>
                <div>
                  <label className={labelCls}>Overall Attendance %</label>
                  <input className={inputCls} type="number" min="0" max="100" value={sem.overallAttendance}
                    onChange={(e) => updateSemester(semIdx, 'overallAttendance', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className={labelCls}>SGPA (auto-computed)</label>
                  <input className={`${inputCls} bg-gray-100 cursor-not-allowed`} value={sem.sgpa.toFixed(2)} readOnly />
                </div>
              </div>

              {/* Subjects */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="text-left py-1 pr-2 font-medium w-16">Code</th>
                      <th className="text-left py-1 pr-2 font-medium">Subject Name</th>
                      <th className="text-left py-1 pr-2 font-medium w-16">Credits</th>
                      <th className="text-left py-1 pr-2 font-medium w-16">Grade</th>
                      <th className="text-left py-1 pr-2 font-medium w-20">Attend %</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    {sem.subjects.map((sub, subIdx) => (
                      <tr key={sub.id}>
                        <td className="pr-2 py-1">
                          <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={sub.code}
                            onChange={(e) => updateSubject(semIdx, subIdx, 'code', e.target.value)} placeholder="CS301" />
                        </td>
                        <td className="pr-2 py-1">
                          <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={sub.name}
                            onChange={(e) => updateSubject(semIdx, subIdx, 'name', e.target.value)} placeholder="Data Structures" required />
                        </td>
                        <td className="pr-2 py-1">
                          <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs" type="number" min="1" max="6" value={sub.credits}
                            onChange={(e) => updateSubject(semIdx, subIdx, 'credits', parseInt(e.target.value) || 3)} />
                        </td>
                        <td className="pr-2 py-1">
                          <select className="w-full border border-gray-200 rounded px-2 py-1 text-xs" value={sub.grade}
                            onChange={(e) => updateSubject(semIdx, subIdx, 'grade', e.target.value)}>
                            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </td>
                        <td className="pr-2 py-1">
                          <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs" type="number" min="0" max="100"
                            value={sub.attendancePercentage ?? 85}
                            onChange={(e) => updateSubject(semIdx, subIdx, 'attendancePercentage', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td className="py-1">
                          {sem.subjects.length > 1 && (
                            <button type="button" onClick={() => removeSubject(semIdx, subIdx)} className="text-red-400 hover:text-red-600 px-1">×</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => addSubject(semIdx)} className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                + Add Subject
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full justify-center">
        Save Student
      </Button>
    </form>
  );
}

'use client';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/students/new': 'Add Student',
  '/analytics': 'Analytics',
  '/compare': 'Compare Students',
  '/reports': 'Reports',
};

export default function Header() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? (pathname.includes('/students/') ? 'Student Profile' : 'AcadPulse');

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </header>
  );
}

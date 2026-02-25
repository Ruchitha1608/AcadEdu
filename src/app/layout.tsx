import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AcadPulse — Academic Analytics',
  description: 'Track, analyse and predict academic performance with AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

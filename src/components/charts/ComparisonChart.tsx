'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { STUDENT_COLORS } from '@/constants/chartColors';

interface Props {
  data: Array<Record<string, string | number>>;
  students: string[];
  height?: number;
}

export default function ComparisonChart({ data, students, height = 280 }: Props) {
  if (!data.length) return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Select students</div>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}
        />
        <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
        {students.map((s, i) => (
          <Bar
            key={s}
            dataKey={s}
            name={s}
            fill={STUDENT_COLORS[i % STUDENT_COLORS.length].primary}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

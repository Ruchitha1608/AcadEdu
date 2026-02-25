'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { SubjectBarDataPoint } from '@/types/chart';
import { gradeColor } from '@/constants/gradePoints';

interface Props {
  data: SubjectBarDataPoint[];
  height?: number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: SubjectBarDataPoint }> }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-800">{d.code} — {d.subject}</p>
      <p className="text-gray-500">Credits: {d.credits}</p>
      <p className="text-gray-500">Grade: <span className="font-bold">{d.grade}</span> ({d.gradePoint})</p>
      {d.attendance !== undefined && <p className="text-gray-500">Attendance: {d.attendance?.toFixed(1)}%</p>}
    </div>
  );
};

export default function SubjectBarChart({ data, height = 280 }: Props) {
  if (!data.length) return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="subject"
          tick={{ fontSize: 10, fill: '#6b7280' }}
          angle={-40}
          textAnchor="end"
          interval={0}
        />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="gradePoint" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((entry, idx) => (
            <Cell key={idx} fill={gradeColor(entry.gradePoint)} />
          ))}
          <LabelList dataKey="grade" position="top" style={{ fontSize: 10, fontWeight: 600, fill: '#374151' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

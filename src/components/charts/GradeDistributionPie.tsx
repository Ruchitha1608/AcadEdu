'use client';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { GRADE_COLORS } from '@/constants/chartColors';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  grades: Record<string, number>;
  height?: number;
}

export default function GradeDistributionPie({ grades, height = 260 }: Props) {
  const entries = Object.entries(grades).filter(([, v]) => v > 0);
  if (!entries.length) return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>;

  const total = entries.reduce((acc, [, v]) => acc + v, 0);
  const labels = entries.map(([g]) => g);
  const values = entries.map(([, v]) => v);
  const colors = labels.map((g) => GRADE_COLORS[g] ?? '#9ca3af');

  const chartData = {
    labels,
    datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { position: 'right' as const, labels: { font: { size: 11 }, boxWidth: 12, padding: 10 } },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; raw: unknown }) =>
            ` ${ctx.label}: ${ctx.raw} (${((Number(ctx.raw) / total) * 100).toFixed(1)}%)`,
        },
      },
    },
  };

  return (
    <div style={{ height }} className="relative">
      <Doughnut data={chartData} options={options} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ right: '35%' }}>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800">{total}</p>
          <p className="text-xs text-gray-500">Subjects</p>
        </div>
      </div>
    </div>
  );
}

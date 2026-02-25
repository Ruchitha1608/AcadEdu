'use client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { CGPATrendDataPoint } from '@/types/chart';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Props {
  data: CGPATrendDataPoint[];
  height?: number;
  compact?: boolean;
}

export default function CGPATrendChart({ data, height = 280, compact = false }: Props) {
  if (!data.length) return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data available</div>;

  const labels = data.map((d) => d.semester);
  const sgpaData = data.map((d) => d.sgpa);
  const cgpaData = data.map((d) => d.cgpa);
  const predictedIdx = data.findIndex((d) => d.isPredicted);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'SGPA',
        data: sgpaData,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: data.map((d) => (d.isPredicted ? '#f59e0b' : '#6366f1')),
        pointRadius: data.map((d) => (d.isPredicted ? 6 : 4)),
        pointBorderWidth: data.map((d) => (d.isPredicted ? 2 : 1)),
        pointBorderColor: data.map((d) => (d.isPredicted ? '#fff' : '#6366f1')),
        segment: {
          borderDash: (ctx: { p0DataIndex: number }) =>
            predictedIdx !== -1 && ctx.p0DataIndex >= predictedIdx - 1 ? [5, 4] : [],
          borderColor: (ctx: { p0DataIndex: number }) =>
            predictedIdx !== -1 && ctx.p0DataIndex >= predictedIdx - 1 ? '#f59e0b' : '#6366f1',
        },
      },
      {
        label: 'CGPA',
        data: cgpaData,
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.35,
        pointBackgroundColor: data.map((d) => (d.isPredicted ? '#f59e0b' : '#10b981')),
        pointRadius: data.map((d) => (d.isPredicted ? 6 : 4)),
        borderDash: [3, 3],
        segment: {
          borderDash: (ctx: { p0DataIndex: number }) =>
            predictedIdx !== -1 && ctx.p0DataIndex >= predictedIdx - 1 ? [8, 4] : [3, 3],
          borderColor: (ctx: { p0DataIndex: number }) =>
            predictedIdx !== -1 && ctx.p0DataIndex >= predictedIdx - 1 ? '#f59e0b' : '#10b981',
        },
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 12 }, boxWidth: 12 } },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => `${ctx.dataset?.label ?? ''}: ${Number(ctx.raw).toFixed(2)}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          afterLabel: (ctx: any) => data[ctx.dataIndex]?.isPredicted ? '(Predicted)' : '',
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 10,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { size: 11 }, stepSize: 2 },
      },
      x: { grid: { display: false }, ticks: { font: { size: compact ? 10 : 11 } } },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

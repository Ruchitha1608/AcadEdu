'use client';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { RadarDataPoint } from '@/types/chart';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Props {
  data: RadarDataPoint[];
  students?: Array<{ name: string; data: RadarDataPoint[]; color: string }>;
  height?: number;
}

export default function SkillRadarChart({ data, students, height = 300 }: Props) {
  const isEmpty = !data.length && !students?.length;
  if (isEmpty) return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>;

  const useMulti = !!students?.length;
  const labels = (useMulti ? students![0].data : data).map((d) => d.skill);

  const datasets = useMulti
    ? students!.map((s) => ({
        label: s.name,
        data: s.data.map((d) => d.score),
        borderColor: s.color,
        backgroundColor: s.color + '33',
        pointBackgroundColor: s.color,
        borderWidth: 2,
        pointRadius: 4,
      }))
    : [
        {
          label: 'Skill Strength',
          data: data.map((d) => d.score),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.15)',
          pointBackgroundColor: '#6366f1',
          borderWidth: 2,
          pointRadius: 4,
        },
      ];

  const chartData = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: { stepSize: 2, font: { size: 10 }, backdropColor: 'transparent' },
        pointLabels: { font: { size: 11 } },
        grid: { color: 'rgba(0,0,0,0.07)' },
      },
    },
    plugins: {
      legend: { position: 'bottom' as const, labels: { font: { size: 11 }, boxWidth: 12 } },
    },
  };

  return (
    <div style={{ height }}>
      <Radar data={chartData} options={options} />
    </div>
  );
}

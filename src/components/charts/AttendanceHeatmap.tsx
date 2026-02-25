'use client';
import { useEffect, useRef } from 'react';
import { HeatmapCell } from '@/types/chart';

interface Props {
  data: HeatmapCell[];
  height?: number;
}

export default function AttendanceHeatmap({ data, height = 300 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data.length || !containerRef.current) return;

    import('plotly.js-dist-min').then((Plotly) => {
      const semesters = [...new Set(data.map((d) => d.semester))].sort((a, b) => a - b);
      const months = [...new Set(data.map((d) => d.month))];

      const zMatrix: (number | null)[][] = semesters.map((sem) =>
        months.map((month) => {
          const cell = data.find((d) => d.semester === sem && d.month === month);
          return cell ? Math.min(100, Math.max(0, cell.value)) : null;
        })
      );

      const yLabels = semesters.map((s) => `Sem ${s}`);

      const trace = {
        type: 'heatmap',
        z: zMatrix,
        x: months,
        y: yLabels,
        colorscale: [
          [0, '#fee2e2'],
          [0.5, '#fef3c7'],
          [0.75, '#d1fae5'],
          [1, '#065f46'],
        ],
        zmin: 0,
        zmax: 100,
        hoverongaps: false,
        hovertemplate: '%{y} — %{x}: <b>%{z:.1f}%</b><extra></extra>',
        showscale: true,
        colorbar: {
          title: { text: 'Attendance %', font: { size: 11 } },
          thickness: 14,
          len: 0.8,
          tickfont: { size: 10 },
        },
      };

      const layout = {
        margin: { t: 20, b: 60, l: 60, r: 60 },
        xaxis: { tickangle: -30, tickfont: { size: 11 } },
        yaxis: { tickfont: { size: 11 } },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { family: 'Inter, sans-serif' },
        annotations: [{
          x: 0.5,
          y: -0.25,
          xref: 'paper',
          yref: 'paper',
          text: '— 75% attendance threshold critical —',
          showarrow: false,
          font: { size: 10, color: '#ef4444' },
        }],
      };

      const config = { responsive: true, displayModeBar: false };

      if (containerRef.current) {
        Plotly.newPlot(containerRef.current, [trace], layout, config);
      }
    });

    return () => {
      import('plotly.js-dist-min').then((Plotly) => {
        if (containerRef.current) Plotly.purge(containerRef.current);
      });
    };
  }, [data]);

  if (!data.length) return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No attendance data</div>;

  return <div ref={containerRef} style={{ height, width: '100%' }} />;
}

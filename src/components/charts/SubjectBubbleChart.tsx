'use client';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Subject } from '@/types/student';

interface BubbleNode {
  id: string;
  name: string;
  code: string;
  credits: number;
  gradePoint: number;
  attendance: number;
  grade: string;
  category: string;
}

interface Props {
  subjects: Subject[];
  height?: number;
}

const GRADE_COLORS: Record<string, string> = {
  excellent: '#22c55e',  // GP >= 9  (O)
  good:      '#3b82f6',  // GP >= 8  (A+, A)
  average:   '#f59e0b',  // GP >= 6  (B+, B, C)
  low:       '#ef4444',  // GP < 6   (P, F)
};

function gradeColor(gp: number) {
  if (gp >= 9) return GRADE_COLORS.excellent;
  if (gp >= 8) return GRADE_COLORS.good;
  if (gp >= 6) return GRADE_COLORS.average;
  return GRADE_COLORS.low;
}

export default function SubjectBubbleChart({ subjects, height = 380 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!subjects.length || !svgRef.current) return;

    const el = svgRef.current;
    const W = el.getBoundingClientRect().width || 600;
    const H = height;
    const margin = { top: 30, right: 30, bottom: 54, left: 52 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    // Filter subjects with attendance data
    const data: BubbleNode[] = subjects
      .filter((s) => s.attendancePercentage != null)
      .map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code || '',
        credits: s.credits,
        gradePoint: s.gradePoint,
        attendance: s.attendancePercentage!,
        grade: s.grade,
        category: s.category || 'core',
      }));

    if (!data.length) return;

    // Clear previous
    d3.select(el).selectAll('*').remove();

    const svg = d3.select(el)
      .attr('width', W)
      .attr('height', H);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear().domain([40, 105]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, 10.5]).range([innerH, 0]);
    const rScale = d3.scaleSqrt()
      .domain([1, d3.max(data, (d) => d.credits) || 6])
      .range([12, 26]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(yScale)
          .ticks(5)
          .tickSize(-innerW)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-dasharray', '3,3');
    g.select('.grid .domain').remove();

    // Quadrant shading — danger zone (low att + low grade)
    const x75 = xScale(75);
    const y7 = yScale(7);

    g.append('rect')
      .attr('x', 0)
      .attr('y', y7)
      .attr('width', x75)
      .attr('height', innerH - y7)
      .attr('fill', '#fef2f2')
      .attr('opacity', 0.5);

    // Reference lines
    // Vertical: 75% attendance threshold
    g.append('line')
      .attr('x1', x75).attr('x2', x75)
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,4')
      .attr('opacity', 0.7);

    g.append('text')
      .attr('x', x75 + 4)
      .attr('y', 12)
      .attr('fill', '#ef4444')
      .attr('font-size', 10)
      .text('75% min');

    // Horizontal: GP = 7 line (acceptable)
    g.append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', y7).attr('y2', y7)
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,4')
      .attr('opacity', 0.7);

    g.append('text')
      .attr('x', innerW - 4)
      .attr('y', y7 - 5)
      .attr('fill', '#6366f1')
      .attr('font-size', 10)
      .attr('text-anchor', 'end')
      .text('GP 7.0');

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat((d) => `${d}%`))
      .selectAll('text')
      .attr('font-size', 11)
      .attr('fill', '#64748b');

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text')
      .attr('font-size', 11)
      .attr('fill', '#64748b');

    // Axis labels
    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 44)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('fill', '#475569')
      .text('Attendance (%)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('fill', '#475569')
      .text('Grade Point');

    // Tooltip div
    const tooltip = d3.select(tooltipRef.current)
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('background', 'white')
      .style('border', '1px solid #e2e8f0')
      .style('border-radius', '8px')
      .style('padding', '8px 12px')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.08)')
      .style('font-size', '12px')
      .style('z-index', '50')
      .style('min-width', '140px');

    // Bubbles
    const bubbles = g.selectAll('.bubble')
      .data(data)
      .join('g')
      .attr('class', 'bubble')
      .attr('transform', (d) => `translate(${xScale(d.attendance)},${yScale(d.gradePoint)})`);

    bubbles.append('circle')
      .attr('r', 0)
      .attr('fill', (d) => gradeColor(d.gradePoint))
      .attr('fill-opacity', 0.25)
      .attr('stroke', (d) => gradeColor(d.gradePoint))
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .transition()
      .duration(600)
      .delay((_, i) => i * 60)
      .ease(d3.easeBounceOut)
      .attr('r', (d) => rScale(d.credits));

    // Short label inside bubble
    bubbles.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', 9)
      .attr('font-weight', '600')
      .attr('fill', (d) => gradeColor(d.gradePoint))
      .attr('pointer-events', 'none')
      .attr('opacity', 0)
      .text((d) => d.grade)
      .transition()
      .duration(400)
      .delay((_, i) => i * 60 + 400)
      .attr('opacity', 1);

    // Hover interactions
    bubbles
      .on('mouseenter', function (event, d) {
        d3.select(this).select('circle')
          .transition().duration(150)
          .attr('fill-opacity', 0.5)
          .attr('stroke-width', 3);

        const rect = (svgRef.current?.parentElement as HTMLElement)?.getBoundingClientRect();
        const ex = event.clientX - (rect?.left ?? 0) + 12;
        const ey = event.clientY - (rect?.top ?? 0) - 10;

        tooltip
          .style('left', `${ex}px`)
          .style('top', `${ey}px`)
          .style('opacity', '1')
          .html(`
            <div style="font-weight:600;color:#1e293b;margin-bottom:4px">${d.name}</div>
            <div style="color:#64748b">${d.code}</div>
            <div style="margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:4px">
              <span style="color:#475569">Grade:</span><span style="font-weight:600;color:${gradeColor(d.gradePoint)}">${d.grade} (${d.gradePoint})</span>
              <span style="color:#475569">Attendance:</span><span style="font-weight:600;color:${d.attendance >= 75 ? '#22c55e' : '#ef4444'}">${d.attendance}%</span>
              <span style="color:#475569">Credits:</span><span style="font-weight:600">${d.credits}</span>
              <span style="color:#475569">Category:</span><span style="font-weight:600;text-transform:capitalize">${d.category}</span>
            </div>
          `);
      })
      .on('mouseleave', function () {
        d3.select(this).select('circle')
          .transition().duration(150)
          .attr('fill-opacity', 0.25)
          .attr('stroke-width', 2);

        tooltip.style('opacity', '0');
      });

    // Legend
    const legendData = [
      { label: 'O  (≥9.0)', color: GRADE_COLORS.excellent },
      { label: 'A+ / A  (≥8.0)', color: GRADE_COLORS.good },
      { label: 'B+ – C  (≥6.0)', color: GRADE_COLORS.average },
      { label: 'P / F  (<6.0)', color: GRADE_COLORS.low },
    ];

    const legend = svg.append('g')
      .attr('transform', `translate(${W - margin.right - 130}, ${margin.top})`);

    legendData.forEach((item, i) => {
      const row = legend.append('g').attr('transform', `translate(0,${i * 18})`);
      row.append('circle').attr('r', 6).attr('fill', item.color).attr('fill-opacity', 0.3).attr('stroke', item.color).attr('stroke-width', 1.5);
      row.append('text').attr('x', 12).attr('y', 0).attr('dominant-baseline', 'central').attr('font-size', 10).attr('fill', '#475569').text(item.label);
    });

    // Bubble size legend
    const sizeNote = svg.append('text')
      .attr('x', W - margin.right - 130)
      .attr('y', margin.top + legendData.length * 18 + 14)
      .attr('font-size', 10)
      .attr('fill', '#94a3b8')
      .text('Bubble size = credits');
    sizeNote; // avoid unused warning

  }, [subjects, height]);

  if (!subjects.length) {
    return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No subject data</div>;
  }

  const hasAttendance = subjects.some((s) => s.attendancePercentage != null);
  if (!hasAttendance) {
    return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No per-subject attendance data available</div>;
  }

  return (
    <div className="relative w-full">
      <svg ref={svgRef} width="100%" height={height} />
      <div ref={tooltipRef} />
    </div>
  );
}

'use client';
import { SubjectImpact } from '@/types/student';

interface Props {
  impacts: SubjectImpact[];
  sgpaDelta: number;
  cgpaDelta: number;
  baseline: number;
  currentSGPA: number;
  currentCGPA: number;
  prevCGPA: number;
  isFirstSemester: boolean;
}

function sign(n: number) {
  return n > 0 ? '+' : '';
}

function deltaColor(n: number) {
  if (n > 0.05) return 'text-emerald-600';
  if (n < -0.05) return 'text-red-500';
  return 'text-gray-500';
}

export default function SubjectImpactChart({
  impacts,
  sgpaDelta,
  cgpaDelta,
  baseline,
  currentSGPA,
  currentCGPA,
  prevCGPA,
  isFirstSemester,
}: Props) {
  if (impacts.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No subject data available.</p>;
  }

  const maxAbsImpact = Math.max(...impacts.map((i) => Math.abs(i.impact)), 0.01);

  return (
    <div className="space-y-4">
      {/* Header: CGPA / SGPA delta */}
      <div className="flex flex-wrap gap-4 text-sm">
        {isFirstSemester ? (
          <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-4 py-2.5">
            <span className="text-indigo-500 font-medium">Baseline (avg SGPA):</span>
            <span className="font-bold text-indigo-700">{baseline.toFixed(2)}</span>
            <span className="text-gray-400 text-xs ml-1">Subjects compared against your average</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
              <span className="text-gray-500">SGPA</span>
              <span className="font-semibold text-gray-700">{(currentSGPA - sgpaDelta).toFixed(2)}</span>
              <span className="text-gray-300">→</span>
              <span className="font-bold text-gray-900">{currentSGPA.toFixed(2)}</span>
              <span className={`font-semibold ${deltaColor(sgpaDelta)}`}>
                ({sign(sgpaDelta)}{sgpaDelta.toFixed(2)})
              </span>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
              <span className="text-gray-500">CGPA</span>
              <span className="font-semibold text-gray-700">{prevCGPA.toFixed(2)}</span>
              <span className="text-gray-300">→</span>
              <span className="font-bold text-gray-900">{currentCGPA.toFixed(2)}</span>
              <span className={`font-semibold ${deltaColor(cgpaDelta)}`}>
                ({sign(cgpaDelta)}{cgpaDelta.toFixed(2)})
              </span>
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-400" />
          Boosted SGPA
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-400" />
          Dragged SGPA
        </span>
        <span className="text-gray-300">|</span>
        <span>Baseline: {baseline.toFixed(2)} {isFirstSemester ? '(avg)' : '(prev sem SGPA)'}</span>
      </div>

      {/* Subject bars */}
      <div className="space-y-2.5">
        {impacts.map((item) => {
          const isPositive = item.impact >= 0;
          const barWidth = Math.round((Math.abs(item.impact) / maxAbsImpact) * 100);

          return (
            <div key={item.code} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-gray-400 shrink-0">{item.code}</span>
                  <span className="text-sm text-gray-700 truncate" title={item.subjectName}>
                    {item.subjectName}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3 text-xs">
                  <span className="text-gray-400">GP {item.gradePoint.toFixed(1)} · {item.credits}cr</span>
                  <span className={`font-semibold tabular-nums w-14 text-right ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {sign(item.impact)}{item.impact.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="flex items-center gap-1 h-5">
                {/* Left side (negative) */}
                <div className="flex-1 flex justify-end">
                  {!isPositive && (
                    <div
                      className="h-4 rounded-l-md bg-red-400 transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  )}
                </div>

                {/* Centre line */}
                <div className="w-px h-5 bg-gray-200 shrink-0" />

                {/* Right side (positive) */}
                <div className="flex-1">
                  {isPositive && (
                    <div
                      className="h-4 rounded-r-md bg-emerald-400 transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 pt-1">
        Impact = (Grade Point − Baseline) × Credits / Total Credits for this semester
      </p>
    </div>
  );
}

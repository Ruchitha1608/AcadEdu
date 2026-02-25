'use client';
import { useState } from 'react';
import { Student } from '@/types/student';
import { AIInsights } from '@/types/student';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { computeConsistencyScore, getConsistencyLabel } from '@/lib/consistency';
import { predictNextSemester, getSubjectRecommendations, getStrengths, getWarnings } from '@/lib/predictions';

interface Props {
  student: Student;
  onUpdate: (insights: AIInsights) => void;
}

export default function AIInsightsPanel({ student, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const insights = student.aiInsights;

  const generateInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, semesters: student.semesters }),
      });
      const data = await res.json();
      if (data.success && data.insights) {
        onUpdate(data.insights);
      } else {
        // Fallback to local computation
        generateLocal();
      }
    } catch {
      generateLocal();
    } finally {
      setLoading(false);
    }
  };

  const generateLocal = () => {
    const result = predictNextSemester(student.semesters);
    const consistencyScore = computeConsistencyScore(student.semesters);
    const insights: AIInsights = {
      predictedNextSGPA: result.predictedSGPA,
      predictedNextCGPA: result.predictedCGPA,
      predictionConfidence: result.confidence,
      predictionMethod: result.method,
      predictionBreakdown: result.breakdown,
      recommendedSubjects: getSubjectRecommendations(student.semesters),
      consistencyScore,
      consistencyLabel: getConsistencyLabel(consistencyScore),
      strengths: getStrengths(student.semesters),
      warnings: getWarnings(student.semesters),
      generatedAt: new Date().toISOString(),
    };
    onUpdate(insights);
  };

  const consistencyColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 65) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 45) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-4">
      {!insights && (
        <div className="text-center py-10">
          <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
            <svg className="h-7 w-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm mb-4">Generate AI-powered insights for this student</p>
          <Button onClick={generateInsights} loading={loading} disabled={student.semesters.length === 0}>
            Generate Insights
          </Button>
          {student.semesters.length === 0 && <p className="text-xs text-gray-400 mt-2">Add semester data first</p>}
        </div>
      )}

      {insights && (
        <>
          {/* Prediction */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
              <p className="text-xs text-indigo-600 font-medium mb-1">Predicted Next SGPA</p>
              <p className="text-3xl font-bold text-indigo-700">{insights.predictedNextSGPA.toFixed(2)}</p>
              <p className="text-xs text-indigo-400 mt-1">
                Confidence: {Math.round(insights.predictionConfidence * 100)}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs text-emerald-600 font-medium mb-1">Predicted Next CGPA</p>
              <p className="text-3xl font-bold text-emerald-700">{insights.predictedNextCGPA.toFixed(2)}</p>
              <p className="text-xs text-emerald-400 mt-1">Credit-weighted avg</p>
            </div>
          </div>

          {/* ML Model Info */}
          {insights.predictionMethod && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600">ML Prediction Model</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                  ${insights.predictionMethod === 'random_forest_ensemble'
                    ? 'bg-violet-100 text-violet-700'
                    : insights.predictionMethod === 'polynomial'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'}`}>
                  {insights.predictionMethod === 'random_forest_ensemble' ? 'Random Forest + Poly + EWMA'
                    : insights.predictionMethod === 'polynomial' ? 'Polynomial + EWMA'
                    : insights.predictionMethod === 'ensemble' ? 'Poly + EWMA'
                    : 'EWMA'}
                </span>
              </div>
              {insights.predictionBreakdown && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  {insights.predictionBreakdown.randomForest !== undefined && (
                    <div className="bg-violet-50 rounded-lg p-2">
                      <p className="text-[10px] text-violet-500 font-medium">Random Forest</p>
                      <p className="text-sm font-bold text-violet-700">{insights.predictionBreakdown.randomForest.toFixed(2)}</p>
                    </div>
                  )}
                  {insights.predictionBreakdown.polynomial !== undefined && (
                    <div className="bg-blue-50 rounded-lg p-2">
                      <p className="text-[10px] text-blue-500 font-medium">Polynomial</p>
                      <p className="text-sm font-bold text-blue-700">{insights.predictionBreakdown.polynomial.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="bg-teal-50 rounded-lg p-2">
                    <p className="text-[10px] text-teal-500 font-medium">EWMA</p>
                    <p className="text-sm font-bold text-teal-700">{insights.predictionBreakdown.ewma.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Consistency Score */}
          <div className={`p-4 rounded-xl border ${consistencyColor(insights.consistencyScore)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Performance Consistency</p>
                <p className="text-xs opacity-70 mt-0.5">{insights.consistencyLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{insights.consistencyScore}</p>
                <p className="text-xs opacity-60">/100</p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${insights.consistencyScore}%`,
                  backgroundColor: 'currentColor',
                  opacity: 0.7,
                }}
              />
            </div>
          </div>

          {/* Recommended Subjects */}
          {insights.recommendedSubjects.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-sm font-semibold text-amber-800 mb-2">Focus Areas</p>
              <div className="flex flex-wrap gap-2">
                {insights.recommendedSubjects.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {insights.strengths.length > 0 && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
              <p className="text-sm font-semibold text-green-800 mb-2">Strengths</p>
              <ul className="space-y-1">
                {insights.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-green-700">
                    <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {insights.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm font-semibold text-red-800 mb-2">Warnings</p>
              <ul className="space-y-1">
                {insights.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                    <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Generated: {new Date(insights.generatedAt).toLocaleString()}</p>
            <Button variant="ghost" size="sm" onClick={generateInsights} loading={loading}>
              Refresh
            </Button>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}

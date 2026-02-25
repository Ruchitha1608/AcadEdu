/**
 * ML-based CGPA/SGPA prediction engine
 *
 * Strategy (chosen by data size):
 *   N=1        → EWMA only                       (confidence 0.25)
 *   N=2-3      → Polynomial(deg=2) + EWMA        (confidence 0.35-0.55)
 *   N>=4       → Ensemble: RF + Poly(deg=2) + EWMA (confidence 0.60+)
 *
 * Features fed to Random Forest:
 *   [semNum, sgpa, prevSGPA, momentum, rollingAvg2, attendance, backlogs, cgpa, creditRatio]
 */

import { Semester } from '@/types/student';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PolynomialRegression } = require('ml-regression');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { RandomForestRegression } = require('ml-random-forest');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PredictionResult {
  predictedSGPA: number;
  predictedCGPA: number;
  confidence: number;
  method: 'random_forest_ensemble' | 'polynomial' | 'ewma' | 'ensemble';
  breakdown: {
    polynomial?: number;
    randomForest?: number;
    ewma: number;
  };
}

// ─── Feature Engineering ──────────────────────────────────────────────────────

/**
 * Build a feature vector for predicting the SGPA of semester at index `predIdx`
 * using data available from semesters 0..predIdx-1.
 */
function buildFeatures(sorted: Semester[], predIdx: number): number[] {
  // semIdx is 0-based; the semester we want to predict is predIdx (0-based)
  const prev = sorted[predIdx - 1];
  const prev2 = predIdx >= 2 ? sorted[predIdx - 2] : null;

  const semNum = predIdx + 1;                                         // 1-based semester number being predicted
  const prevSGPA = prev.sgpa;
  const prev2SGPA = prev2?.sgpa ?? prevSGPA;
  const momentum = prevSGPA - prev2SGPA;                             // SGPA Δ over last 2 sems
  const rollingAvg2 = (prevSGPA + prev2SGPA) / 2;
  const attendance = prev.overallAttendance / 100;                   // normalised 0-1
  const backlogs = prev.backlogs;
  const cgpa = prev.cgpaAfterSemester;
  const creditRatio = prev.earnedCredits / Math.max(1, prev.totalCredits); // 0-1

  return [semNum, prevSGPA, prev2SGPA, momentum, rollingAvg2, attendance, backlogs, cgpa, creditRatio];
}

// ─── EWMA (Holt's Double Exponential Smoothing) ───────────────────────────────

function ewmaPredict(sgpaValues: number[]): number {
  if (sgpaValues.length === 0) return 0;
  if (sgpaValues.length === 1) return sgpaValues[0];

  const alpha = 0.65; // level smoothing — higher = more weight to recent sems
  const beta = 0.30;  // trend smoothing

  let level = sgpaValues[0];
  let trend = sgpaValues[1] - sgpaValues[0];

  for (let i = 1; i < sgpaValues.length; i++) {
    const prevLevel = level;
    level = alpha * sgpaValues[i] + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  // One-step-ahead forecast
  return level + trend;
}

// ─── Polynomial Regression ───────────────────────────────────────────────────

function polynomialPredict(sorted: Semester[]): { value: number; r2: number } {
  const x = sorted.map((_, i) => i + 1);
  const y = sorted.map((s) => s.sgpa);

  const degree = sorted.length >= 5 ? 3 : 2;
  try {
    const model = new PolynomialRegression(x, y, degree);
    const nextX = sorted.length + 1;
    const raw = model.predict(nextX) as number;

    // Compute R² (in-sample)
    const mean = y.reduce((a, b) => a + b, 0) / y.length;
    const ssTot = y.reduce((acc, yi) => acc + (yi - mean) ** 2, 0);
    const ssRes = y.reduce((acc, yi, i) => {
      const pred = model.predict(x[i]) as number;
      return acc + (yi - pred) ** 2;
    }, 0);
    const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

    return { value: raw, r2 };
  } catch {
    // Fallback to linear
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi ** 2, 0);
    const denom = n * sumXX - sumX ** 2;
    const slope = denom ? (n * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / n;
    return { value: slope * (sorted.length + 1) + intercept, r2: 0.4 };
  }
}

// ─── Random Forest Regression ─────────────────────────────────────────────────

function randomForestPredict(sorted: Semester[]): { value: number; confidence: number } | null {
  if (sorted.length < 4) return null; // need at least 3 training pairs

  try {
    // Build training set: for each i from 1 to N-1, predict sorted[i].sgpa using features(i)
    const X: number[][] = [];
    const y: number[] = [];

    for (let i = 1; i < sorted.length; i++) {
      X.push(buildFeatures(sorted, i));
      y.push(sorted[i].sgpa);
    }

    const rf = new RandomForestRegression({
      nEstimators: sorted.length >= 6 ? 50 : 20,
      maxFeatures: 0.8,        // use 80% of features per split
      replacement: true,       // bootstrap sampling
      seed: 42,
    });

    rf.train(X, y);

    // Predict next semester features
    const nextFeatures = buildFeatures(sorted, sorted.length);
    const pred = rf.predict([nextFeatures])[0] as number;

    // Leave-one-out (LOO) cross-validation for confidence estimation
    let looSsRes = 0;
    const mean = y.reduce((a, b) => a + b, 0) / y.length;
    const ssTot = y.reduce((acc, yi) => acc + (yi - mean) ** 2, 0);

    for (let j = 0; j < X.length; j++) {
      const trainX = X.filter((_, i) => i !== j);
      const trainY = y.filter((_, i) => i !== j);
      if (trainX.length < 2) continue;

      const rfLoo = new RandomForestRegression({ nEstimators: 10, maxFeatures: 0.8, replacement: true, seed: 42 });
      rfLoo.train(trainX, trainY);
      const looPred = rfLoo.predict([X[j]])[0] as number;
      looSsRes += (y[j] - looPred) ** 2;
    }

    const looR2 = ssTot === 0 ? 0.7 : Math.max(0, 1 - looSsRes / ssTot);

    return { value: pred, confidence: looR2 };
  } catch {
    return null;
  }
}

// ─── Clamp helper ────────────────────────────────────────────────────────────

function clamp(v: number, lo = 4.0, hi = 10.0): number {
  return parseFloat(Math.min(hi, Math.max(lo, v)).toFixed(2));
}

// ─── Attendance adjustment ────────────────────────────────────────────────────

function attendancePenalty(sorted: Semester[]): number {
  const n = sorted.length;
  if (!n) return 0;
  const recent = sorted.slice(-2);
  const avg = recent.reduce((acc, s) => acc + s.overallAttendance, 0) / recent.length;
  if (avg < 65) return 0.18;
  if (avg < 75) return 0.10;
  if (avg < 85) return 0.04;
  return 0;
}

// ─── Predicted CGPA ──────────────────────────────────────────────────────────

function computePredictedCGPA(sorted: Semester[], predictedSGPA: number): number {
  const credits = sorted.map((s) => s.totalCredits);
  const lastCredits = credits[credits.length - 1];
  const allSGPAs = [...sorted.map((s) => s.sgpa), predictedSGPA];
  const allCredits = [...credits, lastCredits];
  const weighted = allSGPAs.reduce((acc, sgpa, i) => acc + sgpa * allCredits[i], 0);
  const total = allCredits.reduce((a, b) => a + b, 0);
  return parseFloat((weighted / total).toFixed(2));
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function predictNextSemester(semesters: Semester[]): PredictionResult {
  if (!semesters?.length) {
    return { predictedSGPA: 0, predictedCGPA: 0, confidence: 0, method: 'ewma', breakdown: { ewma: 0 } };
  }

  const sorted = [...semesters].sort((a, b) => a.semesterNumber - b.semesterNumber);
  const sgpaValues = sorted.map((s) => s.sgpa);
  const penalty = attendancePenalty(sorted);

  // ── N=1: only EWMA fallback ──
  if (sorted.length === 1) {
    const ewma = clamp(sorted[0].sgpa);
    return {
      predictedSGPA: ewma,
      predictedCGPA: computePredictedCGPA(sorted, ewma),
      confidence: Math.max(0.10, 0.25 - penalty),
      method: 'ewma',
      breakdown: { ewma },
    };
  }

  // ── Always compute EWMA ──
  const ewmaVal = clamp(ewmaPredict(sgpaValues));

  // ── N=2-3: Polynomial + EWMA ──
  if (sorted.length < 4) {
    const { value: polyVal, r2 } = polynomialPredict(sorted);
    const poly = clamp(polyVal);
    // Blend: slightly favour poly since it models trend
    const ensemble = clamp(poly * 0.60 + ewmaVal * 0.40);
    const conf = parseFloat(Math.min(0.60, Math.max(0.25, r2 * 0.55 - penalty)).toFixed(2));

    return {
      predictedSGPA: ensemble,
      predictedCGPA: computePredictedCGPA(sorted, ensemble),
      confidence: conf,
      method: 'polynomial',
      breakdown: { polynomial: poly, ewma: ewmaVal },
    };
  }

  // ── N>=4: Full ensemble — RF + Polynomial + EWMA ──
  const { value: polyVal, r2: polyR2 } = polynomialPredict(sorted);
  const poly = clamp(polyVal);
  const rfResult = randomForestPredict(sorted);

  let ensemble: number;
  let method: PredictionResult['method'];
  let confidence: number;
  const breakdown: PredictionResult['breakdown'] = { polynomial: poly, ewma: ewmaVal };

  if (rfResult) {
    const rf = clamp(rfResult.value);
    breakdown.randomForest = rf;

    // Spread penalty: if models disagree strongly, reduce confidence
    const spread = Math.abs(rf - poly) + Math.abs(poly - ewmaVal);
    const spreadPenalty = Math.min(0.15, spread * 0.05);

    // Weighted ensemble: RF(50%) + Poly(30%) + EWMA(20%)
    // give more weight to RF since it uses multi-dimensional features
    ensemble = clamp(rf * 0.50 + poly * 0.30 + ewmaVal * 0.20);
    confidence = parseFloat(
      Math.min(0.92, Math.max(0.40,
        rfResult.confidence * 0.55 + polyR2 * 0.30 + 0.15 - penalty - spreadPenalty
      )).toFixed(2)
    );
    method = 'random_forest_ensemble';
  } else {
    ensemble = clamp(poly * 0.65 + ewmaVal * 0.35);
    confidence = parseFloat(Math.min(0.72, Math.max(0.35, polyR2 * 0.65 - penalty)).toFixed(2));
    method = 'ensemble';
  }

  return {
    predictedSGPA: ensemble,
    predictedCGPA: computePredictedCGPA(sorted, ensemble),
    confidence,
    method,
    breakdown,
  };
}

// ─── Unchanged helpers (kept for API compatibility) ──────────────────────────

export function getSubjectRecommendations(semesters: Semester[]): string[] {
  const subjectMap: Record<string, { totalPoints: number; count: number; latestAttendance?: number }> = {};
  for (const sem of semesters) {
    for (const sub of sem.subjects) {
      if (!subjectMap[sub.name]) subjectMap[sub.name] = { totalPoints: 0, count: 0 };
      subjectMap[sub.name].totalPoints += sub.gradePoint;
      subjectMap[sub.name].count += 1;
      if (sub.attendancePercentage !== undefined) subjectMap[sub.name].latestAttendance = sub.attendancePercentage;
    }
  }
  return Object.entries(subjectMap)
    .map(([name, data]) => ({ name, avgGP: data.totalPoints / data.count, attendance: data.latestAttendance ?? 100 }))
    .filter((s) => s.avgGP < 8 || s.attendance < 80)
    .sort((a, b) => a.avgGP - b.avgGP)
    .slice(0, 5)
    .map((s) => s.name);
}

export function getStrengths(semesters: Semester[]): string[] {
  const strengths: string[] = [];
  if (!semesters.length) return strengths;
  const sorted = [...semesters].sort((a, b) => a.semesterNumber - b.semesterNumber);
  const cgpaValues = sorted.map((s) => s.cgpaAfterSemester);
  const totalBacklogs = sorted.reduce((acc, s) => acc + s.backlogs, 0);
  const avgAttendance = sorted.reduce((acc, s) => acc + s.overallAttendance, 0) / sorted.length;
  if (cgpaValues[cgpaValues.length - 1] >= 8.5) strengths.push('High academic achiever (CGPA ≥ 8.5)');
  if (sorted.length > 1 && cgpaValues[cgpaValues.length - 1] > cgpaValues[0]) strengths.push('Consistent upward CGPA trend');
  if (totalBacklogs === 0) strengths.push('Zero backlogs throughout program');
  if (avgAttendance >= 90) strengths.push('Excellent attendance record');
  return strengths;
}

export function getWarnings(semesters: Semester[]): string[] {
  const warnings: string[] = [];
  if (!semesters.length) return warnings;
  const sorted = [...semesters].sort((a, b) => a.semesterNumber - b.semesterNumber);
  const totalBacklogs = sorted.reduce((acc, s) => acc + s.backlogs, 0);
  const avgAttendance = sorted.reduce((acc, s) => acc + s.overallAttendance, 0) / sorted.length;
  if (totalBacklogs > 0) warnings.push(`${totalBacklogs} backlog(s) need to be cleared`);
  if (avgAttendance < 75) warnings.push('Overall attendance below 75% threshold');
  if (sorted.length > 1) {
    const lastTwo = sorted.slice(-2).map((s) => s.overallAttendance);
    if (lastTwo[1] - lastTwo[0] < -8) warnings.push('Attendance has dropped significantly in recent semester');
  }
  const latestSem = sorted[sorted.length - 1];
  const lowAtt = latestSem.subjects.filter((s) => s.attendancePercentage !== undefined && s.attendancePercentage < 75);
  if (lowAtt.length > 0) warnings.push(`${lowAtt.length} subject(s) with attendance below 75%`);
  if (sorted.length >= 3) {
    const recent = sorted.slice(-3).map((s) => s.cgpaAfterSemester);
    if (recent[2] < recent[1] && recent[1] < recent[0]) warnings.push('CGPA has been declining for the last 3 semesters');
  }
  return warnings;
}

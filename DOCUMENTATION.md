# AcadPulse — Complete Documentation

> Academic Analytics Dashboard · Next.js 16 · React 19 · TypeScript

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Getting Started](#3-getting-started)
4. [Project Structure](#4-project-structure)
5. [Feature Walkthrough](#5-feature-walkthrough)
   - [Login System](#51-login-system)
   - [Dashboard](#52-dashboard)
   - [Adding a Student](#53-adding-a-student)
   - [Student Profile](#54-student-profile)
   - [Analytics](#55-analytics)
   - [Compare Students](#56-compare-students)
   - [Reports & PDF](#57-reports--pdf)
6. [Charts & Visualizations](#6-charts--visualizations)
7. [ML Prediction Engine](#7-ml-prediction-engine)
8. [Performance Consistency Score](#8-performance-consistency-score)
9. [Subject Recommendations](#9-subject-recommendations)
10. [Data Model](#10-data-model)
11. [Demo Data](#11-demo-data)
12. [API Routes](#12-api-routes)
13. [Storage Architecture](#13-storage-architecture)
14. [Grade System](#14-grade-system)

---

## 1. Project Overview

AcadPulse is a web application for academic performance analysis. It accepts student data (uploaded PDFs, images, or manually entered), processes it, and produces:

- Semester-by-semester CGPA and SGPA trends
- Per-subject attendance and grade analysis
- ML-based next semester CGPA prediction
- Performance consistency scoring
- Side-by-side comparison of 2–3 students
- Downloadable performance reports
- AI-generated insights and subject recommendations

---

## 2. Tech Stack

| Layer | Library / Tool | Version | Used For |
|---|---|---|---|
| Framework | Next.js | 16.1.6 | App router, API routes, SSR |
| UI | React | 19.2.3 | Component rendering |
| Language | TypeScript | ^5 | Type safety |
| Styling | Tailwind CSS | ^4 | All UI styling |
| Charts | Chart.js + react-chartjs-2 | ^4.5.1 | Line, Radar, Pie charts |
| Charts | Recharts | ^3.7.0 | Bar charts, comparison charts |
| Charts | Plotly.js | ^3.4.0 | Attendance heatmap |
| Charts | **D3.js** | ^7 | Bubble chart (Attendance vs Grade Point) |
| ML | ml-random-forest | ^2.1.0 | CGPA prediction (N≥4 semesters) |
| ML | ml-regression | ^6.3.0 | Polynomial regression prediction |
| AI | @anthropic-ai/sdk | ^0.78.0 | PDF/image data extraction |
| OCR | Tesseract.js | ^7.0.0 | Image marksheet parsing |
| PDF Parse | pdfjs-dist | ^5.4.624 | PDF text extraction |
| PDF Export | jsPDF + html2canvas | ^4.2.0 | Report generation |
| Auth | Web Crypto API | native | SHA-256 password hashing |
| Storage | localStorage | native | All data persistence |

---

## 3. Getting Started

### Prerequisites

- Node.js 18+ and npm
- A modern browser (Chrome, Firefox, Edge, Safari)

### Installation

```bash
# Clone or navigate to the project folder
cd "AI Edu/acadpulse"

# Install all dependencies
npm install

# Start the development server
npm run dev
```

The app starts at **http://localhost:3000**
(If port 3000 is occupied it auto-picks the next available — check terminal output)

### Environment Variables (Optional)

Create a `.env.local` file in the project root:

```env
# Only required if you want AI-powered data extraction from PDFs/images
ANTHROPIC_API_KEY=your_api_key_here
```

Without this key, manual entry and the local ML engine still work fully.

### Build for Production

```bash
npm run build
npm start
```

---

## 4. Project Structure

```
acadpulse/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx          # Login screen
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar + header wrapper
│   │   │   ├── dashboard/page.tsx      # Home dashboard
│   │   │   ├── students/
│   │   │   │   ├── page.tsx            # Student list
│   │   │   │   ├── new/page.tsx        # Add student
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Student profile (4 tabs)
│   │   │   │       └── edit/page.tsx   # Edit student
│   │   │   ├── compare/page.tsx        # Side-by-side comparison
│   │   │   ├── analytics/page.tsx      # Aggregate analytics
│   │   │   └── reports/page.tsx        # PDF report generator
│   │   └── api/
│   │       ├── ai-insights/route.ts    # AI insights endpoint
│   │       └── extract-pdf/route.ts    # PDF/image extraction endpoint
│   │
│   ├── components/
│   │   ├── charts/
│   │   │   ├── CGPATrendChart.tsx      # Line chart (Chart.js)
│   │   │   ├── SubjectBarChart.tsx     # Bar chart (Recharts)
│   │   │   ├── SkillRadarChart.tsx     # Radar chart (Chart.js)
│   │   │   ├── GradeDistributionPie.tsx# Pie chart (Chart.js)
│   │   │   ├── AttendanceHeatmap.tsx   # Heatmap (Plotly)
│   │   │   ├── SubjectBubbleChart.tsx  # Bubble chart (D3.js) ← new
│   │   │   └── ComparisonChart.tsx     # Bar comparison (Recharts)
│   │   ├── student/
│   │   │   ├── StudentCard.tsx         # Summary card in list
│   │   │   └── AIInsightsPanel.tsx     # ML insights display
│   │   ├── upload/
│   │   │   ├── FileUploadZone.tsx      # Drag & drop upload
│   │   │   └── ManualEntryForm.tsx     # Manual data entry form
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   │   └── Header.tsx              # Top bar
│   │   └── ui/                         # Button, Card, Badge, Avatar, Tabs, Spinner
│   │
│   ├── lib/
│   │   ├── predictions.ts              # ML engine (RF + Poly + EWMA)
│   │   ├── consistency.ts              # Performance consistency score
│   │   ├── chartTransformers.ts        # Data → chart format converters
│   │   ├── reportGenerator.ts          # Print-to-PDF logic
│   │   ├── demoData.ts                 # 3 pre-built demo students
│   │   ├── storage.ts                  # localStorage CRUD
│   │   ├── auth.ts                     # Login / register / session
│   │   └── aiExtraction.ts             # Claude API extraction helpers
│   │
│   ├── hooks/
│   │   ├── useStudents.ts              # Student CRUD hook
│   │   └── useAuth.ts                  # Auth state hook
│   │
│   ├── types/
│   │   ├── student.ts                  # Student, Semester, Subject, AIInsights types
│   │   └── chart.ts                    # Chart data point types
│   │
│   └── constants/
│       ├── gradePoints.ts              # Grade → point mapping, color helpers
│       └── chartColors.ts              # Consistent color palette
│
├── public/                             # Static assets
├── DOCUMENTATION.md                    # This file
├── package.json
└── next.config.ts
```

---

## 5. Feature Walkthrough

### 5.1 Login System

**URL:** `http://localhost:3000/login`

The app opens on the login page. All dashboard routes are protected — visiting any `/dashboard/*` URL without a session redirects here.

**Default credentials:**
| Field | Value |
|---|---|
| Username | `admin` |
| Password | `acadpulse123` |

**How it works:**
- Password is hashed with SHA-256 (Web Crypto API) before storing or comparing
- On success, a session is written to `localStorage` with a 7-day expiry
- `useAuth` hook checks this session on every page load and redirects to `/login` when expired
- Multiple accounts can be registered (the register function is available in `src/lib/auth.ts`)

---

### 5.2 Dashboard

**URL:** `/dashboard`

After login you land here. The dashboard shows:

| Section | What it shows |
|---|---|
| **Stats row** | Total students · Average CGPA · Top performer · Count with attendance < 75% |
| **CGPA Trends** | Mini line chart for the 3 most recently updated students |
| **Recent Students** | Quick-link list of last 5 updated profiles |
| **Quick Actions** | Buttons to Add Student, Compare, Analytics, Reports |
| **Demo Banner** | "Load Demo Data" button (first visit) or "Clear Demo" once loaded |

**Loading demo data:**
Click **"Load Demo Data"** on the banner. This seeds 3 complete student profiles (Arjun, Priya, Ravi) instantly — no form filling needed.

---

### 5.3 Adding a Student

**URL:** `/students/new`

Two ways to add a student:

#### Method A — File Upload (PDF / Image)
1. Drag & drop or click to upload a marksheet PDF or image (JPG/PNG/WEBP)
2. The app extracts text using `pdfjs-dist` (for PDFs) or `Tesseract.js` (for images)
3. The extracted text is sent to Claude AI (`/api/extract-pdf`) which parses grades, credits, SGPA, attendance into structured JSON
4. The form is pre-filled — review and submit

**Requires:** `ANTHROPIC_API_KEY` in `.env.local`

#### Method B — Manual Entry
Fill in the form fields:

| Section | Fields |
|---|---|
| **Profile** | Name, Roll Number, Department, Program, Batch, University, Email, Phone |
| **Per Semester** | Semester number, Academic year, Overall attendance %, Backlogs |
| **Per Subject** | Subject code, Name, Credits, Grade (O/A+/A/B+/B/C/P/F), Attendance % |

- SGPA is **auto-computed** from subject grades × credits
- CGPA is **auto-computed** as credit-weighted cumulative average
- Add multiple semesters with the "+ Add Semester" button
- Add multiple subjects within each semester

---

### 5.4 Student Profile

**URL:** `/students/{id}`

The profile is split into 4 tabs:

#### Overview Tab
- **CGPA Trend Chart** — Line chart showing SGPA (semester GPA) and CGPA (cumulative) across all semesters, with a predicted next-semester point shown as a dashed point
- **Grade Distribution Pie** — All subjects across all semesters grouped by letter grade (O, A+, A, B+, B, C, P, F)
- **Semester Summary Table** — Each semester's SGPA, CGPA, credits, attendance %, backlogs at a glance

#### Academics Tab
- **Semester selector** — Toggle between semesters using the pill buttons at the top
- **Subject Grade Comparison** (Recharts bar chart) — Grade point for each subject in the selected semester; color-coded green/blue/yellow/red
- **Attendance vs Grade Point** (D3.js bubble chart) — Each bubble is a subject:
  - X axis = attendance %
  - Y axis = grade point
  - Bubble size = credits
  - Red shaded zone = danger (low attendance + low grade)
  - Dashed reference lines at 75% attendance and GP 7.0
  - Hover tooltip shows full subject details
- **Skill Strength Radar** (Chart.js) — Aggregates grades across subject categories: Mathematics, Programming, Systems, Design, Communication, Lab/Practical
- **Subject Details Table** — Code, name, credits, grade, grade point, attendance for every subject

#### Attendance Tab
- **3 stat boxes** — Average attendance / Best semester / Worst semester
- **Monthly Heatmap** (Plotly.js) — Color grid of attendance % by month × semester. Red = below 75%, yellow = 75–85%, green = 85%+
- **Semester Attendance Bars** — Horizontal progress bars for each semester's overall attendance

#### AI Insights Tab
Click **"Generate Insights"** to run the ML engine locally (no API needed):

| Insight Box | What it shows |
|---|---|
| Predicted Next SGPA | ML ensemble prediction with confidence % |
| Predicted Next CGPA | Credit-weighted CGPA including predicted semester |
| ML Model Info | Which model was used (RF+Poly+EWMA / Poly+EWMA / EWMA) with individual model predictions side by side |
| Performance Consistency | Score /100 with label (Excellent/Good/Average/Inconsistent) and progress bar |
| Focus Areas | Up to 5 subjects to prioritise (low grade or low attendance) |
| Strengths | Detected positives — high CGPA, upward trend, zero backlogs, excellent attendance |
| Warnings | Detected risks — backlogs, attendance below 75%, declining CGPA trend |

Clicking **"Refresh"** re-runs the engine (useful after editing semester data).

---

### 5.5 Analytics

**URL:** `/analytics`

Aggregate view across all students:

| Chart | Library | What it shows |
|---|---|---|
| Department-wise Avg CGPA | Recharts horizontal bar | Average CGPA per department |
| Overall Grade Distribution | Chart.js pie | All grades from all students combined |
| CGPA Distribution | Recharts bar | Count of students in each CGPA band (9–10, 8–9, 7–8, 6–7, <6) |
| Attendance Distribution | Custom progress bars | Count of students in each attendance band |
| Top Performers leaderboard | List | Top 5 students ranked by CGPA with quick-links to their profiles |

Summary stats at the top: Total students · Average CGPA · Number of departments · How many have AI Insights generated

---

### 5.6 Compare Students

**URL:** `/compare`

Select 2 or 3 students by clicking their cards at the top. Cards turn highlighted with a numbered badge.

Once 2+ are selected, four sections appear:

| Section | What it shows |
|---|---|
| **Profile Headers** | Name, roll number, CGPA badge for each selected student side by side |
| **Metric Comparison** (Recharts grouped bar) | Current CGPA, Attendance %, Total Backlogs, Consistency Score — all bars side by side |
| **CGPA Trend Comparison** | Individual line charts for each student stacked vertically, each with prediction point |
| **Skill Strength Comparison** (Chart.js radar) | Overlapping radar polygons — one per student, color-coded |
| **Detailed Comparison Table** | Current CGPA · Best SGPA · Worst SGPA · Avg Attendance · Total Backlogs · Consistency Score · Total Credits · Predicted CGPA |

If AI Insights haven't been generated for a student yet, the Predicted CGPA and Consistency columns show `—`. Generate insights from each student's profile first.

---

### 5.7 Reports & PDF

**URL:** `/reports`

1. Select a student from the dropdown
2. A full report preview renders on screen including:
   - Cover page with student profile, current CGPA, consistency score, generation date
   - Quick stats: semesters, avg attendance, total credits, total backlogs
   - CGPA Trend chart
   - Semester summary table
   - Subject performance bar chart (latest semester)
   - Grade distribution pie chart
   - Skill strength radar chart
   - AI Insights section (predicted SGPA/CGPA, consistency, strengths, warnings)
3. Click **"Print / Save PDF"**

A new window opens with the report and the browser's print dialog launches automatically.

**To save as PDF:**
- **Chrome/Edge:** In the print dialog, set Destination → "Save as PDF" → Save
- **Firefox:** Choose "Microsoft Print to PDF" or "Save to PDF"
- **Safari:** Click the PDF button (bottom-left) → "Save as PDF"

> **Note:** Allow pop-ups for localhost in your browser. If the pop-up is blocked, click the address bar icon to allow it.

---

## 6. Charts & Visualizations

| Chart | File | Library | Where used |
|---|---|---|---|
| CGPA Trend Line | `CGPATrendChart.tsx` | Chart.js | Student profile overview, Dashboard, Compare, Reports |
| Subject Bar | `SubjectBarChart.tsx` | Recharts | Student profile academics, Reports |
| Skill Radar | `SkillRadarChart.tsx` | Chart.js | Student profile academics, Compare, Reports |
| Grade Pie | `GradeDistributionPie.tsx` | Chart.js | Student profile overview, Analytics, Reports |
| Attendance Heatmap | `AttendanceHeatmap.tsx` | Plotly.js | Student profile attendance tab |
| Bubble Chart | `SubjectBubbleChart.tsx` | **D3.js** | Student profile academics tab |
| Comparison Bar | `ComparisonChart.tsx` | Recharts | Compare page |
| Dept CGPA Bar | inline in analytics | Recharts | Analytics page |
| CGPA Distribution | inline in analytics | Recharts | Analytics page |

### D3.js Bubble Chart — Details

The bubble chart maps each subject in a semester onto a 2D scatter plot:

- **X axis:** Attendance percentage (40%–100%)
- **Y axis:** Grade point (0–10)
- **Bubble radius:** Square-root scaled from credits (bigger credit subject = bigger bubble)
- **Color:** Green (GP ≥ 9) → Blue (GP ≥ 8) → Amber (GP ≥ 6) → Red (GP < 6)
- **Red zone:** Bottom-left quadrant (attendance < 75% AND grade point < 7) — shaded pink to highlight at-risk subjects
- **Reference lines:** Vertical dashed red at 75% attendance · Horizontal dashed indigo at GP 7.0
- **Animation:** Bubbles grow from radius 0 on mount with a bounce easing, staggered 60ms apart
- **Tooltip:** Hover any bubble to see subject name, code, exact grade/GP, attendance %, credits, category

---

## 7. ML Prediction Engine

**File:** `src/lib/predictions.ts`

The engine predicts the **next semester's SGPA**, then derives the predicted CGPA from it.

### Algorithm Selection by Data Size

| Semesters of data | Algorithm | Confidence range |
|---|---|---|
| 1 | EWMA only | 0.10 – 0.25 |
| 2 – 3 | Polynomial Regression (deg 2) + EWMA blend | 0.25 – 0.60 |
| **4 or more** | **Random Forest + Polynomial + EWMA ensemble** | 0.40 – 0.92 |

### EWMA (Holt's Double Exponential Smoothing)

Gives more weight to recent semesters. Parameters:
- `α = 0.65` — level smoothing (how fast it reacts to new data)
- `β = 0.30` — trend smoothing (how fast trend direction updates)

Formula:
```
level[i] = α × sgpa[i] + (1−α) × (level[i−1] + trend[i−1])
trend[i] = β × (level[i] − level[i−1]) + (1−β) × trend[i−1]
Prediction = level[last] + trend[last]
```

### Polynomial Regression

Fits a degree-2 polynomial (degree-3 if 5+ semesters) to the (semesterNumber, SGPA) curve and extrapolates to the next point. R² is computed in-sample to weight this model's contribution to confidence.

### Random Forest Regression

Trains on feature vectors built from every semester pair. Each training sample's features:

| Feature | Description |
|---|---|
| `semNum` | 1-based semester number being predicted |
| `prevSGPA` | SGPA of the immediately preceding semester |
| `prev2SGPA` | SGPA two semesters back |
| `momentum` | `prevSGPA − prev2SGPA` (direction of change) |
| `rollingAvg2` | Average of last 2 SGPAs |
| `attendance` | Overall attendance of previous semester (0–1) |
| `backlogs` | Backlog count in previous semester |
| `cgpa` | CGPA after previous semester |
| `creditRatio` | `earnedCredits / totalCredits` (0–1) |

**Hyperparameters:**
- `nEstimators`: 20 (small datasets) or 50 (6+ semesters)
- `maxFeatures`: 0.8 (uses 80% of features per split)
- `bootstrap`: true (replacement sampling)

**Confidence from LOO cross-validation:** Leave-one-out is run on the RF, computing the R² on held-out samples. This R² directly drives confidence.

### Ensemble Blending (N ≥ 4)

```
predictedSGPA = RF × 0.50 + Polynomial × 0.30 + EWMA × 0.20
confidence    = rfR² × 0.55 + polyR² × 0.30 + 0.15 − attendancePenalty − spreadPenalty
```

**Attendance Penalty:** Subtracts from confidence if recent attendance is low:
| Recent avg attendance | Penalty |
|---|---|
| < 65% | −0.18 |
| 65–74% | −0.10 |
| 75–84% | −0.04 |
| ≥ 85% | 0 |

**Spread Penalty:** Reduces confidence when models strongly disagree:
```
spreadPenalty = min(0.15, (|RF−Poly| + |Poly−EWMA|) × 0.05)
```

### Predicted CGPA

After predicting SGPA, the predicted CGPA is:
```
predictedCGPA = (sum of all historical SGPA×credits + predictedSGPA × lastSemCredits)
                ÷ (total historical credits + lastSemCredits)
```

The next semester is assumed to have the same credit load as the most recent semester.

All predicted values are clamped between **4.0 and 10.0**.

---

## 8. Performance Consistency Score

**File:** `src/lib/consistency.ts`

A composite score from 0 to 100 summarising how stable a student's performance has been.

### Formula

```
score = (varianceScore × 0.40)
      + (trendScore × 0.30)
      + (attendanceScore × 0.20)
      + (backlogScore × 0.10)
```

| Component | Weight | Calculation |
|---|---|---|
| **SGPA Variance** | 40% | `max(0, 100 − (stdDev / 2.0) × 100)` — lower variance = higher score |
| **Trend Direction** | 30% | Linear regression slope of SGPA over semesters: slope ≥ +0.2 → 100; slope ≤ −0.2 → ≤40 |
| **Attendance Consistency** | 20% | `(avgAttendance/100) × 70 + max(0, 30 − (attStdDev/20) × 30)` |
| **Backlog Penalty** | 10% | `max(0, 100 − backlogs × 20)` — each backlog costs 20 points |

### Labels

| Score | Label |
|---|---|
| 85–100 | Excellent |
| 65–84 | Good |
| 45–64 | Average |
| 0–44 | Inconsistent |

---

## 9. Subject Recommendations

**File:** `src/lib/predictions.ts` — `getSubjectRecommendations()`

Scans all semesters for subjects where:
- **Average grade point < 8.0** across all occurrences of the subject, OR
- **Latest attendance < 80%**

Sorts by average grade point ascending (worst first), returns top 5 subject names as "Focus Areas" in the AI Insights panel.

---

## 10. Data Model

All data lives in the browser's `localStorage` under three keys:

| Key | Content |
|---|---|
| `acadpulse_students` | `Student[]` |
| `acadpulse_users` | `AppUser[]` |
| `acadpulse_session` | `AuthSession` |

### Student

```typescript
{
  id: string                  // UUID
  name: string
  rollNumber: string
  department: string
  program: string             // "B.Tech", "M.Tech", etc.
  batch: string               // "2021–2025"
  email?: string
  phone?: string
  university: string
  avatarColor: string         // hex color for avatar background
  currentSemester: number     // = semesters.length
  currentCGPA: number         // = last semester's cgpaAfterSemester
  semesters: Semester[]
  aiInsights?: AIInsights
  createdAt: string           // ISO date
  updatedAt: string           // ISO date
}
```

### Semester

```typescript
{
  id: string
  semesterNumber: number
  academicYear: string        // "2022–23"
  session?: 'odd' | 'even'
  sgpa: number
  cgpaAfterSemester: number
  totalCredits: number
  earnedCredits: number
  subjects: Subject[]
  attendance: AttendanceRecord[]   // monthly breakdown
  overallAttendance: number        // 0–100
  backlogs: number
}
```

### Subject

```typescript
{
  id: string
  code: string                // "CS2101"
  name: string                // "Data Structures"
  credits: number
  grade: string               // "O", "A+", "A", "B+", "B", "C", "P", "F"
  gradePoint: number          // 10, 9, 8.5, 8, 7, 6, 5, 0
  marksObtained?: number
  maxMarks?: number
  attendancePercentage?: number  // 0–100
  category?: 'core' | 'elective' | 'lab' | 'project'
}
```

### AIInsights

```typescript
{
  predictedNextSGPA: number
  predictedNextCGPA: number
  predictionConfidence: number       // 0–1
  predictionMethod: 'random_forest_ensemble' | 'polynomial' | 'ewma' | 'ensemble'
  predictionBreakdown: {
    polynomial?: number
    randomForest?: number
    ewma: number
  }
  recommendedSubjects: string[]
  consistencyScore: number           // 0–100
  consistencyLabel: 'Excellent' | 'Good' | 'Average' | 'Inconsistent'
  strengths: string[]
  warnings: string[]
  generatedAt: string                // ISO date
}
```

---

## 11. Demo Data

**File:** `src/lib/demoData.ts`

Three pre-built students to explore all features without manual data entry. Load via "Load Demo Data" on the dashboard.

| Student | Roll No | Dept | Semesters | CGPA | Story |
|---|---|---|---|---|---|
| **Arjun Sharma** | CSE21001 | Computer Science | 6 | 8.87 | High achiever, steady upward trend, 94% attendance |
| **Priya Nair** | ECE21045 | Electronics | 5 | 7.65 | Consistent mid-range, attendance dipped to 72% in Sem 4 causing CGPA drop |
| **Ravi Kumar** | IT21088 | Information Tech | 4 | 6.42 | Declining trend, 1 backlog in Sem 2 (cleared), low 70% attendance in Sem 4 |

**All demo IDs** start with `demo-student-` — the "Clear Demo" button removes exactly these three students without affecting any real data you've added.

---

## 12. API Routes

### `POST /api/extract-pdf`

Extracts academic data from uploaded file content.

**Request body:**
```json
{
  "fileContent": "base64 encoded file or extracted text",
  "fileType": "pdf" | "image"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "...",
    "rollNumber": "...",
    "semesters": [...]
  }
}
```

Uses Claude claude-sonnet-4-6 to parse the extracted text into the structured data model. Falls back to manual entry UI if extraction fails.

### `POST /api/ai-insights`

Generates AI insights for a student using the local ML engine.

**Request body:**
```json
{
  "studentId": "uuid",
  "semesters": [...]
}
```

**Response:**
```json
{
  "success": true,
  "insights": { ... AIInsights object ... }
}
```

This route runs `predictNextSemester()`, `computeConsistencyScore()`, `getSubjectRecommendations()`, `getStrengths()`, `getWarnings()` server-side and returns the result. If the route fails, `AIInsightsPanel` falls back to running the same functions client-side.

---

## 13. Storage Architecture

All data is stored in the browser — there is no backend database. This means:

- Data persists across page refreshes and browser restarts
- Data is **per-browser** — different browsers or incognito windows have separate data
- Clearing browser data / localStorage removes all student records
- The app works fully offline once loaded (except PDF/image extraction which needs the Anthropic API)

**To back up data:** Open DevTools → Application → Local Storage → copy the value of `acadpulse_students`

**To restore:** Paste it back into the same key

---

## 14. Grade System

AcadPulse uses the 10-point grading scale standard in Indian universities:

| Letter Grade | Grade Point | Performance |
|---|---|---|
| O (Outstanding) | 10 | Exceptional |
| A+ (Excellent) | 9 | Excellent |
| A (Very Good) | 8.5 | Very Good |
| B+ (Good) | 8 | Good |
| B (Above Average) | 7 | Above Average |
| C (Average) | 6 | Average |
| P (Pass) | 5 | Minimum pass |
| F (Fail) | 0 | Fail / Backlog |
| Ab (Absent) | 0 | Absent for exam |
| W (Withheld) | 0 | Result withheld |

**SGPA formula:**
```
SGPA = Σ(gradePoint × credits) / Σ(credits)
```

**CGPA formula:**
```
CGPA = Σ(SGPA × totalCredits per semester) / Σ(totalCredits across all semesters)
```

**Color coding throughout the app:**
| CGPA | Badge color |
|---|---|
| ≥ 8.5 | Green |
| 7.0 – 8.4 | Blue |
| 6.0 – 6.9 | Yellow |
| < 6.0 | Red |

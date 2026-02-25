'use client';
import { useState, useCallback, useRef } from 'react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { Student } from '@/types/student';

interface Props {
  onExtracted: (data: Partial<Student>) => void;
  onManualMode: () => void;
}

type Step = 'idle' | 'reading' | 'extracting' | 'ai' | 'done' | 'error';

const STEPS: Record<Step, string> = {
  idle: '',
  reading: 'Reading file...',
  extracting: 'Extracting text...',
  ai: 'AI analysis...',
  done: 'Done!',
  error: 'Error',
};

export default function FileUploadZone({ onExtracted, onManualMode }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setStep('reading');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', f);
      if (studentName) formData.append('studentName', studentName);

      const endpoint = f.type.startsWith('image/') ? '/api/extract-image' : '/api/extract-pdf';
      setStep('ai');

      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success && data.extractedData) {
        setStep('done');
        onExtracted(data.extractedData);
      } else {
        setStep('error');
        setError(data.error ?? 'Extraction failed. Please use manual entry.');
      }
    } catch (err) {
      setStep('error');
      setError('Could not process file. Please use manual entry instead.');
    }
  }, [studentName, onExtracted]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const isLoading = step === 'reading' || step === 'extracting' || step === 'ai';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Student name hint (optional)</label>
        <input
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Helps AI extract more accurately"
        />
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 transition-colors cursor-pointer
          ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/30'}
          ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />

        {isLoading ? (
          <>
            <Spinner size="lg" />
            <p className="text-sm text-gray-600 font-medium">{STEPS[step]}</p>
          </>
        ) : step === 'done' ? (
          <>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-green-700 font-medium">Data extracted! Review below.</p>
          </>
        ) : (
          <>
            <div className="h-14 w-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <svg className="h-7 w-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Drag &amp; drop your marksheet here</p>
              <p className="text-xs text-gray-400 mt-1">Supports PDF, JPG, PNG, WEBP</p>
              {file && <p className="text-xs text-indigo-600 mt-1">{file.name}</p>}
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <div className="text-center">
        <button onClick={onManualMode} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Use manual entry instead →
        </button>
      </div>
    </div>
  );
}

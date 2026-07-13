import React, { useEffect, useState } from 'react';

const PHASES = [
  { key: 'queued', label: 'Queued' },
  { key: 'starting', label: 'Starting' },
  { key: 'pre-scan', label: 'Pre-scan' },
  { key: 'gemini', label: 'Gemini' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'report', label: 'Report' },
  { key: 'completed', label: 'Done' },
];

const ScanProgress = ({ scan }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const percent = Number.isFinite(Number(scan?.progressPercent)) ? Math.max(0, Math.min(100, Number(scan.progressPercent))) : 0;
  const stage = (scan?.progressStage || scan?.status || 'queued').toString();
  const message =
    scan?.progressMessage ||
    (stage === 'queued' ? 'Waiting in queue...' : stage === 'failed' ? (scan?.error || 'Scan failed') : 'Working...');

  const stageIndex = Math.max(0, PHASES.findIndex((p) => p.key === stage));
  const completedIndex = stage === 'failed' ? Math.max(0, stageIndex - 1) : stageIndex;

  const startedAt = scan?.startedAt ? new Date(scan.startedAt) : null;
  const elapsedSeconds = startedAt && !Number.isNaN(startedAt.getTime()) ? Math.max(0, Math.round((Date.now() - startedAt.getTime()) / 1000)) : elapsed;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card card-blue" style={{ padding: 34 }}>
      <div className="text-center mb-12 relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Analyzing Your Code</h2>
        <div className="flex items-center justify-center gap-3">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
          <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">
            Elapsed: <span className="text-blue-400 font-bold">{formatTime(elapsedSeconds)}</span>
          </p>
        </div>
      </div>

      <div className="card card-glass relative mb-10 z-10" style={{ padding: 20 }}>
        <div className="flex items-center justify-between gap-2 md:gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Progress</span>
              <span className="text-xs font-bold font-mono" style={{ color: 'var(--primary)' }}>
                {percent}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-soft)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${percent}%`,
                  background: 'linear-gradient(90deg, var(--secondary) 0%, var(--primary) 70%, #60D400 100%)',
                  boxShadow: '0 0 16px var(--primary-glow)',
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 md:grid-cols-7 gap-3">
          {PHASES.map((phase, idx) => {
            const isCompleted = idx < completedIndex && stage !== 'failed';
            const isActive = idx === stageIndex && stage !== 'failed' && stage !== 'completed';
            const isDone = stage === 'completed' && idx === PHASES.findIndex((p) => p.key === 'completed');
            const isFailed = stage === 'failed';

            return (
              <div key={phase.key} className="flex flex-col items-center text-center">
                <div
                  className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm md:text-base transition-all duration-300 ${
                    isFailed
                      ? 'text-red-300'
                      : isDone && phase.key === 'completed'
                      ? 'text-green-300'
                      : isCompleted
                      ? 'text-green-300'
                      : isActive
                      ? 'text-white scale-105'
                      : 'text-gray-500'
                  }`}
                  style={{
                    background: isFailed
                      ? 'rgba(239, 68, 68, 0.10)'
                      : isDone && phase.key === 'completed'
                      ? 'rgba(16, 185, 129, 0.12)'
                      : isCompleted
                      ? 'rgba(16, 185, 129, 0.10)'
                      : isActive
                      ? 'rgba(172, 236, 0, 0.12)'
                      : 'rgba(0, 13, 26, 0.35)',
                    border: `1px solid ${
                      isFailed
                        ? 'rgba(239, 68, 68, 0.25)'
                        : isDone && phase.key === 'completed'
                        ? 'rgba(16, 185, 129, 0.25)'
                        : isCompleted
                        ? 'rgba(16, 185, 129, 0.18)'
                        : isActive
                        ? 'rgba(172, 236, 0, 0.30)'
                        : 'var(--border-soft)'
                    }`,
                    boxShadow: isActive ? '0 0 0 8px rgba(172, 236, 0, 0.08)' : undefined,
                  }}
                  title={phase.label}
                >
                  {isCompleted || (isDone && phase.key === 'completed') ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`mt-2 text-[11px] md:text-xs font-extrabold uppercase tracking-wider ${
                    isActive ? 'text-blue-300' : isCompleted ? 'text-green-300' : 'text-gray-500'
                  }`}
                >
                  {phase.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center mb-10 relative z-10">
        <div className="relative inline-block mb-6">
          <div
            className="w-20 h-20 rounded-full animate-spin"
            style={{
              border: '2px solid rgba(255,255,255,0.10)',
              borderTopColor: 'var(--primary)',
            }}
          />
        </div>
        <p className="text-white text-xl font-medium tracking-tight mb-2">
          {message}
        </p>
        {scan?.status === 'failed' ? (
          <p className="text-red-300 text-sm m-0">The scan failed. Please try again in a moment.</p>
        ) : (
          <p className="text-gray-500 text-sm m-0">This updates live as the backend completes each step.</p>
        )}
      </div>

      <div className="card card-glass" style={{ padding: 14 }}>
        <p className="text-gray-400 text-xs text-center m-0">
          Scanning <span style={{ color: 'var(--primary)', fontWeight: 800 }}>OWASP Top 10</span> patterns +{' '}
          <span style={{ color: 'rgba(147, 197, 253, 0.95)', fontWeight: 800 }}>Gemini</span> deep analysis
        </p>
      </div>

      {scan?.preScanHints && scan.preScanHints.length > 0 && (
        <div className="card mt-8 relative z-10 animate-fade-in" style={{ padding: 18, borderColor: 'rgba(251, 191, 36, 0.25)', background: 'rgba(251, 191, 36, 0.05)' }}>
          <div className="flex items-center gap-2 mb-3">
             <span className="flex h-2 w-2 rounded-full bg-yellow-500"></span>
             <p className="text-yellow-500 font-bold text-xs uppercase tracking-widest">Initial Findings Detected</p>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {scan.preScanHints.map((hint, idx) => (
              <li key={idx} className="text-gray-400 text-xs flex items-center gap-2">
                <span className="text-yellow-500/50">•</span> {hint}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ScanProgress;

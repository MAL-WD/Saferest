import React from 'react';

const GRADE_COLORS = {
  'A+': { ring: 'ring-green-500/30', text: 'text-green-300', stroke: 'text-green-400' },
  A: { ring: 'ring-green-500/30', text: 'text-green-300', stroke: 'text-green-400' },
  B: { ring: 'ring-blue-500/30', text: 'text-blue-300', stroke: 'text-blue-400' },
  C: { ring: 'ring-yellow-500/30', text: 'text-yellow-300', stroke: 'text-yellow-400' },
  D: { ring: 'ring-orange-500/30', text: 'text-orange-300', stroke: 'text-orange-400' },
  F: { ring: 'ring-red-500/30', text: 'text-red-300', stroke: 'text-red-400' },
};

const GRADE_TEXT = {
  'A+': 'Excellent Security',
  A: 'Good Security',
  B: 'Acceptable Security',
  C: 'Risky',
  D: 'Very Risky',
  F: 'Critical Risk',
};

function getRiskMeta(score) {
  if (score <= 12) return { label: 'Low', color: 'rgba(16, 185, 129, 0.95)', glow: 'rgba(16, 185, 129, 0.20)' };
  if (score <= 25) return { label: 'Moderate', color: 'rgba(172, 236, 0, 0.95)', glow: 'rgba(172, 236, 0, 0.22)' };
  if (score <= 45) return { label: 'Elevated', color: 'rgba(234, 179, 8, 0.95)', glow: 'rgba(234, 179, 8, 0.20)' };
  if (score <= 65) return { label: 'High', color: 'rgba(255, 184, 48, 0.95)', glow: 'rgba(255, 184, 48, 0.22)' };
  return { label: 'Critical', color: 'rgba(239, 68, 68, 0.95)', glow: 'rgba(239, 68, 68, 0.22)' };
}

function getModelLabel(model) {
  const m = (model || '').toString().toLowerCase().trim();
  if (!m) return null;
  if (m === 'regex-fallback') return { label: 'Limited scan (local engine)', hint: 'Gemini was unavailable; results are regex-based only.' };
  if (m.includes('gemini')) return { label: 'Gemini deep scan', hint: `Model: ${model}` };
  return { label: `Model: ${model}`, hint: '' };
}

const ScanSummaryCard = ({ scan }) => {
  if (!scan || !scan.summary) {
    return null;
  }

  const { grade, riskScore, total, critical, high, medium, low, info } = scan.summary;
  const gradeStyle = GRADE_COLORS[grade] || GRADE_COLORS.B;
  const safeRisk = Number.isFinite(Number(riskScore)) ? Math.max(0, Math.min(100, Number(riskScore))) : 0;
  const riskMeta = getRiskMeta(safeRisk);
  const modelMeta = getModelLabel(scan.aiModel);

  return (
    <div className="card card-blue" style={{ padding: 28 }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 items-stretch mb-8">
        <div
          className="rounded-2xl"
          style={{
            padding: 22,
            background: 'rgba(13, 37, 64, 0.55)',
          }}
        >
          <div className="text-muted" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.08, textTransform: 'uppercase' }}>
            Security grade
          </div>
          <div style={{ fontSize: 20, fontWeight: 950, marginTop: 6, lineHeight: 1.2 }} className="truncate">
            {GRADE_TEXT[grade] || 'Assessment'}
          </div>
          <div className="flex" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
            <span
              className="badge"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${riskMeta.glow}`,
                color: gradeStyle.text.includes('green')
                  ? 'rgba(110, 231, 183, 0.95)'
                  : gradeStyle.text.includes('blue')
                  ? 'rgba(147, 197, 253, 0.95)'
                  : gradeStyle.text.includes('yellow')
                  ? 'rgba(234, 179, 8, 0.95)'
                  : gradeStyle.text.includes('orange')
                  ? 'rgba(255, 184, 48, 0.95)'
                  : 'rgba(239, 68, 68, 0.95)',
              }}
              title="Overall grade from findings severity mix"
            >
              Grade {grade}
            </span>
            {modelMeta && (
              <span
                className="badge"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border-soft)',
                  color: 'rgba(240,246,255,0.92)',
                }}
                title={modelMeta.hint || modelMeta.label}
              >
                {modelMeta.label}
              </span>
            )}
          </div>
          {modelMeta?.hint ? (
            <p style={{ marginTop: 10, marginBottom: 0, fontSize: 12, lineHeight: 1.5 }} className="text-muted">
              {modelMeta.hint}
            </p>
          ) : null}
        </div>

        <div
          className="flex flex-col items-center justify-center gap-2 rounded-2xl"
          style={{
            padding: 22,
            background: 'rgba(13, 37, 64, 0.55)',
          }}
        >
          <div className="relative w-28 h-28 md:w-32 md:h-32">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={riskMeta.color}
                strokeWidth="10"
                strokeDasharray={`${safeRisk * 2.83} 283`}
                strokeLinecap="round"
              />
              <text
                x="50"
                y="50"
                textAnchor="middle"
                dy="0.34em"
                fill="white"
                style={{ fontSize: 24, fontWeight: 800 }}
              >
                {safeRisk}
              </text>
            </svg>
          </div>
          <div className="flex" style={{ gap: 8, alignItems: 'center', marginTop: 2 }}>
            <span className="text-muted" style={{ fontSize: 13, fontWeight: 700 }}>Risk score</span>
            <span
              className="badge"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${riskMeta.glow}`,
                color: riskMeta.color,
              }}
              title="Higher score means higher risk"
            >
              {riskMeta.label}
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl"
          style={{
            padding: 22,
            background: 'rgba(13, 37, 64, 0.55)',
          }}
        >
          <div className="text-muted" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.08, textTransform: 'uppercase' }}>
            Findings summary
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
            <div style={{ fontSize: 22, fontWeight: 950, color: 'var(--text)' }}>{total}</div>
            <div className="text-muted" style={{ fontSize: 13, fontWeight: 700 }}>
              finding{total === 1 ? '' : 's'}
            </div>
          </div>
          <div className="flex" style={{ gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {total === 0 ? (
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'rgba(110, 231, 183, 0.95)' }}>
                No issues detected
              </span>
            ) : (
              <>
                {critical > 0 && <span className="badge badge-critical">Critical {critical}</span>}
                {high > 0 && <span className="badge badge-high">High {high}</span>}
                {medium > 0 && <span className="badge badge-medium">Medium {medium}</span>}
                {low > 0 && <span className="badge badge-low">Low {low}</span>}
                {info > 0 && <span className="badge badge-info">Info {info}</span>}
              </>
            )}
          </div>
        </div>
      </div>

      {scan.summary.overallAssessment && (
        <div className="card card-glass" style={{ padding: 16, marginBottom: 18 }}>
          <p className="text-gray-200 m-0 leading-relaxed">{scan.summary.overallAssessment}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 pt-4 text-sm" style={{ borderTop: '1px solid var(--border-soft)' }}>
        <span className="text-gray-400">
          <strong className="text-white">Language</strong>: {scan.language}
        </span>
        {scan.filename && (
          <span className="text-gray-400">
            <strong className="text-white">Target</strong>: {scan.filename}
          </span>
        )}
        {scan.scanDuration && (
          <span className="text-gray-400">
            <strong className="text-white">Duration</strong>: {(scan.scanDuration / 1000).toFixed(1)}s
          </span>
        )}
      </div>
    </div>
  );
};

export default ScanSummaryCard;

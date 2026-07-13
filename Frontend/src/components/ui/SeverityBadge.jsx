const SEVERITY_MAP = {
  CRITICAL: { label: 'Critical', cls: 'badge-critical' },
  HIGH:     { label: 'High',     cls: 'badge-high'     },
  MEDIUM:   { label: 'Medium',   cls: 'badge-medium'   },
  LOW:      { label: 'Low',      cls: 'badge-low'      },
  INFO:     { label: 'Info',     cls: 'badge-info'     },
};

export default function SeverityBadge({ severity }) {
  const item = SEVERITY_MAP[severity?.toUpperCase()] || SEVERITY_MAP.INFO;
  return (
    <span className={`badge ${item.cls}`}>
      {item.label}
    </span>
  );
}

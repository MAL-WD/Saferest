import styles from './DonutGauge.module.css';

export default function DonutGauge({ value = 0, max = 5, label, accent = '#013ff6' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className={styles.gauge}>
      <div className={styles.ringWrap}>
        <svg className={styles.svg} viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className={styles.progress}
          />
        </svg>
        <div className={styles.center}>
          <span className={styles.value}>{value}</span>
          <span className={styles.max}>/ {max}</span>
        </div>
      </div>
      <p className={styles.label}>{label}</p>
    </div>
  );
}

import styles from './ScanProgressBar.module.css';

export default function ScanProgressBar({ percent = 0, scanner = '' }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>
          {scanner ? `Running: ${scanner}` : 'Initializing...'}
        </span>
        <span className={styles.percent}>{percent}%</span>
      </div>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

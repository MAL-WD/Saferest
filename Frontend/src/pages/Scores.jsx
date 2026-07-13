import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FiTrendingUp } from 'react-icons/fi';
import api from '../services/api';
import styles from './WebsiteScan.module.css';

export default function Scores() {
  const [scores, setScores] = useState([]);
  const [domain, setDomain] = useState('');
  const [hist, setHist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Security Scores - Saferest AI';
    api.get('/scores').then((r) => {
      setScores(r.data.scores || []);
      const first = r.data.scores?.[0]?.domain;
      if (first) setDomain(first);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!domain) return;
    api.get(`/scores/domain/${encodeURIComponent(domain)}`).then((r) => setHist(r.data.history || []));
  }, [domain]);

  const chartData = [...hist].reverse().map((h) => ({
    t: new Date(h.createdAt).toLocaleDateString(),
    score: h.score,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2><FiTrendingUp style={{ verticalAlign: 'middle', marginRight: 8 }} />Security scores</h2>
        <p>Historical grades derived from completed scans.</p>
      </div>
      {loading ? <div className="skeleton" style={{ height: 120 }} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {scores.map((s) => (
            <button
              key={s._id}
              type="button"
              className="card"
              style={{ textAlign: 'left', cursor: 'pointer', border: domain === s.domain ? '2px solid var(--primary)' : undefined }}
              onClick={() => setDomain(s.domain)}
            >
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{s.letterGrade}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{s.domain}</div>
              <div>{s.score}/100</div>
            </button>
          ))}
        </div>
      )}
      {domain && chartData.length > 0 && (
        <div className="card" style={{ marginTop: 24, height: 300 }}>
          <h3>Trend: {domain}</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartData}>
              <XAxis dataKey="t" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

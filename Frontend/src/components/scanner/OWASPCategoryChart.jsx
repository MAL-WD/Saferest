// src/components/scanner/OWASPCategoryChart.jsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

export default function OWASPCategoryChart({ findings }) {
  // Group findings by OWASP category
  const dataMap = findings.reduce((acc, f) => {
    const cat = f.owaspCategory || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const data = Object.keys(dataMap)
    .map((key) => ({
      name: key.replace('OWASP ', '').trim(),
      count: dataMap[key],
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // top 5

  if (data.length === 0) return <p style={{ color: 'var(--text-muted)' }}>No categorized findings yet.</p>;

  // Tooltip content
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#000', border: '1px solid var(--border)', padding: '10px', borderRadius: '4px', fontSize: '0.9rem' }}>
          <p style={{ margin: 0, color: 'var(--primary)' }}>{payload[0].payload.name}</p>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text)' }}>Count: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={120} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--danger)' : 'var(--secondary)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

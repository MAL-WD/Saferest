// src/components/scanner/RiskScoreGauge.jsx
import { ResponsiveContainer, PieChart, Pie, Cell, Label } from 'recharts';

export default function RiskScoreGauge({ score }) {
  // score is 0-100
  // Higher is worse risk.
  
  let color = 'var(--success)';
  if (score > 30) color = 'var(--warning)';
  if (score > 70) color = 'var(--danger)';

  const data = [
    { name: 'Risk', value: score },
    { name: 'Safe', value: 100 - score }
  ];

  return (
    <div style={{ width: '100%', height: 200, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell key="cell-0" fill={color} />
            <Cell key="cell-1" fill="var(--border)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute', 
        bottom: '10px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)', lineHeight: 1 }}>
          {score}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Risk Score
        </div>
      </div>
    </div>
  );
}

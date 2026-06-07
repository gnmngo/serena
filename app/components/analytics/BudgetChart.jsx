'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Events', value: 35000, color: '#343434' },
  { name: 'Supplies', value: 12000, color: '#3B82F6' },
  { name: 'Infrastructure', value: 8000, color: '#22C55E' },
  { name: 'Emergency', value: 5000, color: '#F59E0B' },
];

export default function BudgetChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
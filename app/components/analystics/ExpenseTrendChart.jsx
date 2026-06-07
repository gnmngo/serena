'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Sample monthly data – replace with real data from your API
const sampleData = [
  { month: 'Jan', expenses: 15000 },
  { month: 'Feb', expenses: 12000 },
  { month: 'Mar', expenses: 18000 },
  { month: 'Apr', expenses: 10000 },
  { month: 'May', expenses: 22000 },
  { month: 'Jun', expenses: 14000 },
];

export default function ExpenseTrendChart({ data = sampleData, title = 'Monthly Expense Trend' }) {
  return (
    <div className="w-full h-full">
      <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `₱${value.toLocaleString()}`} />
          <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
          <Legend />
          <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
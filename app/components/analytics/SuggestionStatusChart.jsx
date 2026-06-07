'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Sample data – replace with real data from your API
const sampleData = [
  { status: 'Pending', count: 5 },
  { status: 'Under Review', count: 8 },
  { status: 'Accepted', count: 12 },
  { status: 'Implemented', count: 6 },
  { status: 'Declined', count: 3 },
];

export default function SuggestionStatusChart({ data = sampleData, title = 'Suggestion Status Distribution' }) {
  return (
    <div className="w-full h-full">
      <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// Sample data – replace with real data from your API
const sampleData = [
  { event: 'Acquaintance Party', registered: 45, attended: 38 },
  { event: 'Hackathon 2025', registered: 30, attended: 28 },
  { event: 'Career Talk', registered: 60, attended: 52 },
  { event: 'CEC Week', registered: 80, attended: 65 },
];

export default function EventParticipationChart({ data = sampleData, title = 'Event Participation Overview' }) {
  return (
    <div className="w-full h-full">
      <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="event" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="registered" fill="#3B82F6" name="Registered" />
          <Bar dataKey="attended" fill="#22C55E" name="Attended" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
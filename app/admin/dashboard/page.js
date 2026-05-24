'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import StatsCard from '../../components/ui/StatsCard';
import { ChartBarIcon, CurrencyDollarIcon, ChatBubbleLeftEllipsisIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBudget: 0,
    totalExpenses: 0,
    pendingSuggestions: 0,
    totalEvents: 0,
    chartData: [],
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch transactions
      const { data: transactions } = await supabase.from('budget_transactions').select('amount, transaction_date');
      const totalIncome = transactions?.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) || 0;
      const totalExpenses = transactions?.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0) || 0;

      // Fetch pending suggestions count
      const { count: pending } = await supabase.from('suggestions').select('*', { count: 'exact', head: true }).eq('status', 'pending');

      // Fetch total events
      const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });

      // Chart data (last 6 transactions)
      const chartData = transactions?.slice(0, 6).map(t => ({
        date: new Date(t.transaction_date).toLocaleDateString(),
        amount: Math.abs(t.amount),
      })) || [];

      setStats({
        totalBudget: totalIncome,
        totalExpenses,
        pendingSuggestions: pending || 0,
        totalEvents: eventsCount || 0,
        chartData,
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="space-y-8 animate-fadeInUp">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Budget" value={`₱${stats.totalBudget.toLocaleString()}`} icon={<CurrencyDollarIcon className="w-6 h-6" />} color="success" />
        <StatsCard title="Total Expenses" value={`₱${stats.totalExpenses.toLocaleString()}`} icon={<ChartBarIcon className="w-6 h-6" />} color="danger" />
        <StatsCard title="Pending Suggestions" value={stats.pendingSuggestions} icon={<ChatBubbleLeftEllipsisIcon className="w-6 h-6" />} color="warning" />
        <StatsCard title="Total Events" value={stats.totalEvents} icon={<CalendarIcon className="w-6 h-6" />} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Expenses Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/suggestions" className="btn-primary text-center">Manage Suggestions</Link>
            <Link href="/admin/budget" className="btn-primary text-center">Edit Budget</Link>
            <Link href="/announcements/new" className="btn-secondary text-center">Post Announcement</Link>
            <Link href="/transparency/new" className="btn-secondary text-center">Add Document</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
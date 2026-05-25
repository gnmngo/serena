import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StatsCard from '@/components/ui/StatsCard';
import { ChartBarIcon, CurrencyDollarIcon, ChatBubbleLeftEllipsisIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/login');

  // Fetch dashboard data
  const { data: transactions } = await supabase.from('budget_transactions').select('amount, transaction_date');
  const { count: pendingSuggestions } = await supabase.from('suggestions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: totalEvents } = await supabase.from('events').select('*', { count: 'exact', head: true });
  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

  const totalIncome = transactions?.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) || 0;
  const totalExpenses = transactions?.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0) || 0;

  const chartData = transactions?.slice(0, 6).map(t => ({
    date: new Date(t.transaction_date).toLocaleDateString(),
    amount: Math.abs(t.amount),
  })) || [];

  return (
    <div className="space-y-8 animate-fadeInUp">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Budget" value={`₱${totalIncome.toLocaleString()}`} icon={<CurrencyDollarIcon className="w-6 h-6" />} color="success" />
        <StatsCard title="Total Expenses" value={`₱${totalExpenses.toLocaleString()}`} icon={<ChartBarIcon className="w-6 h-6" />} color="danger" />
        <StatsCard title="Pending Suggestions" value={pendingSuggestions || 0} icon={<ChatBubbleLeftEllipsisIcon className="w-6 h-6" />} color="warning" />
        <StatsCard title="Total Events" value={totalEvents || 0} icon={<CalendarIcon className="w-6 h-6" />} />
      </div>

      {/* Charts + Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Expenses Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
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
            <Link href="/admin/users" className="btn-secondary text-center col-span-2">👥 Manage Users</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, DollarSign, CalendarDays, TrendingUp, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import BudgetChart from '@/components/analytics/BudgetChart';
import ExpenseTrendChart from '@/components/analytics/ExpenseTrendChart';
import SuggestionStatusChart from '@/components/analytics/SuggestionStatusChart';
import { ActivityFeed } from '@/components/ui/ActivityFeed';

// Helper to get recent activity from multiple tables
async function getRecentActivity(supabase) {
  const activities = [];

  // Recent suggestions
  const { data: suggestions } = await supabase
    .from('suggestions')
    .select('title, created_at, status')
    .order('created_at', { ascending: false })
    .limit(3);
  suggestions?.forEach(s => {
    activities.push({
      message: `New suggestion: "${s.title.substring(0, 50)}${s.title.length > 50 ? '...' : ''}"`,
      timeAgo: new Date(s.created_at).toLocaleDateString(),
      user: 'Student',
    });
  });

  // Recent announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('title, published_at')
    .order('published_at', { ascending: false })
    .limit(3);
  announcements?.forEach(a => {
    activities.push({
      message: `Announcement posted: "${a.title.substring(0, 50)}${a.title.length > 50 ? '...' : ''}"`,
      timeAgo: new Date(a.published_at).toLocaleDateString(),
      user: 'Council',
    });
  });

  // Recent budget transactions
  const { data: transactions } = await supabase
    .from('budget_transactions')
    .select('description, transaction_date, amount')
    .order('transaction_date', { ascending: false })
    .limit(3);
  transactions?.forEach(t => {
    const type = t.amount > 0 ? 'Income' : 'Expense';
    activities.push({
      message: `${type} recorded: ${t.description} (₱${Math.abs(t.amount).toLocaleString()})`,
      timeAgo: new Date(t.transaction_date).toLocaleDateString(),
      user: 'Finance',
    });
  });

  // Sort by date (newest first) and limit to 10
  return activities.slice(0, 8);
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/login');

  // Fetch metrics
  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: pendingSuggestions } = await supabase.from('suggestions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: implementedSuggestions } = await supabase.from('suggestions').select('*', { count: 'exact', head: true }).eq('status', 'implemented');
  const { count: totalEvents } = await supabase.from('events').select('*', { count: 'exact', head: true });
  const { count: totalAnnouncements } = await supabase.from('announcements').select('*', { count: 'exact', head: true });

  // Financial metrics
  const { data: transactions } = await supabase.from('budget_transactions').select('amount');
  const totalIncome = transactions?.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) || 0;
  const totalExpenses = transactions?.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0) || 0;
  const balance = totalIncome - totalExpenses;
  const budgetUtilization = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  // Chart data preparations
  const expenseByCategory = transactions?.filter(t => t.amount < 0).reduce((acc, t) => {
    const cat = t.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
    return acc;
  }, {});
  const expenseChartData = Object.entries(expenseByCategory || {}).map(([name, value]) => ({
    name,
    value,
    color: name === 'expense' ? '#EF4444' : '#3B82F6',
  }));

  const monthlyTrend = transactions?.reduce((acc, t) => {
    const date = new Date(t.transaction_date);
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!acc[monthYear]) acc[monthYear] = { month: monthYear, expenses: 0, income: 0 };
    if (t.amount > 0) acc[monthYear].income += t.amount;
    else acc[monthYear].expenses += Math.abs(t.amount);
    return acc;
  }, {});
  const trendData = Object.values(monthlyTrend || {}).map(item => ({
    month: item.month,
    expenses: item.expenses,
    income: item.income,
  })).slice(-6);

  const suggestionStatusData = await getSuggestionStatusData(supabase);

  const recentActivities = await getRecentActivity(supabase);

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/suggestions"><Button variant="outline">Review Suggestions</Button></Link>
          <Link href="/admin/budget"><Button>Manage Budget</Button></Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Suggestions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSuggestions || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Budget Utilization</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetUtilization.toFixed(1)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${budgetUtilization}%` }}></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Implemented Suggestions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{implementedSuggestions || 0}</div>
            <p className="text-xs text-muted-foreground">Total implemented</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional KPI row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Events</div>
            <div className="text-2xl font-bold">{totalEvents || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Announcements</div>
            <div className="text-2xl font-bold">{totalAnnouncements || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Remaining Balance</div>
            <div className="text-2xl font-bold text-green-600">₱{balance.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetChart data={expenseChartData} title="" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expense Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseTrendChart data={trendData} title="" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Suggestion Status</CardTitle>
          </CardHeader>
          <CardContent>
            <SuggestionStatusChart data={suggestionStatusData} title="" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={recentActivities} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Footer */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link href="/admin/budget"><Button variant="outline" className="w-full">💰 Add Transaction</Button></Link>
        <Link href="/announcements/new"><Button variant="outline" className="w-full">📢 Post Announcement</Button></Link>
        <Link href="/transparency/new"><Button variant="outline" className="w-full">📄 Add Document</Button></Link>
        <Link href="/admin/activity-logs"><Button variant="outline" className="w-full">📋 View Activity Logs</Button></Link>
      </div>
    </div>
  );
}

// Helper function to get suggestion status counts
async function getSuggestionStatusData(supabase) {
  const { data: suggestions } = await supabase.from('suggestions').select('status');
  const statusCount = {};
  suggestions?.forEach(s => { statusCount[s.status] = (statusCount[s.status] || 0) + 1; });
  return Object.entries(statusCount).map(([status, count]) => ({ status, count }));
}
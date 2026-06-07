import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { getUserRole } from '@/utils/getUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ExportButton from '@/components/ExportButton';
import TransactionFilters from '@/components/TransactionFilters';
import BudgetChart from '@/components/analytics/BudgetChart';
import ExpenseTrendChart from '@/components/analytics/ExpenseTrendChart';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function getFileIcon(url) {
  if (!url) return '📄';
  const ext = url.split('.').pop().toLowerCase();
  if (ext === 'pdf') return '📑';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
  if (ext === 'doc' || ext === 'docx') return '📝';
  if (ext === 'xls' || ext === 'xlsx') return '📊';
  return '📎';
}

async function deletePost(formData) {
  'use server';
  const id = formData.get('id');
  const supabase = await createClient();
  await supabase.from('transparency_posts').delete().eq('id', id);
  revalidatePath('/transparency');
  redirect('/transparency');
}

export default async function TransparencyPage({ searchParams }) {
  const supabase = await createClient();
  const role = await getUserRole();
  const isAdmin = role === 'admin';

  const startDate = searchParams?.startDate || '';
  const endDate = searchParams?.endDate || '';
  const category = searchParams?.category || 'all';
  const searchQuery = searchParams?.search || '';

  let query = supabase.from('budget_transactions').select('*').order('transaction_date', { ascending: false });
  if (startDate) query = query.gte('transaction_date', startDate);
  if (endDate) query = query.lte('transaction_date', endDate);
  if (category !== 'all') query = query.eq('category', category);
  if (searchQuery) query = query.ilike('description', `%${searchQuery}%`);

  const { data: transactions } = await query;
  const { data: posts } = await supabase
    .from('transparency_posts')
    .select('*')
    .order('published_at', { ascending: false });

  const totalIncome = transactions?.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) || 0;
  const totalExpenses = transactions?.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0) || 0;
  const balance = totalIncome - totalExpenses;
  const budgetUtilization = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  // Prepare chart data
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

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Transparency Center</h1>
        {isAdmin && <Link href="/transparency/new" className="btn-primary">+ Add Document</Link>}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Income</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">₱{totalIncome.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Expenses</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">₱{totalExpenses.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Remaining Balance</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">₱{balance.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Budget Utilization</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{budgetUtilization.toFixed(1)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${budgetUtilization}%` }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-3">Expense Breakdown</h3>
          <BudgetChart data={expenseChartData} />
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-3">Income vs Expense Trend</h3>
          <ExpenseTrendChart data={trendData} />
        </div>
      </div>

      {/* Filters and Transactions Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h2 className="text-xl font-semibold">Budget Transactions</h2>
          <div className="flex gap-2">
            <ExportButton data={transactions || []} fileName="financial_transactions.csv" />
            {isAdmin && <Link href="/admin/budget" className="btn-secondary">Manage</Link>}
          </div>
        </div>

        <TransactionFilters
          onFilterChange={(filters) => {
            const url = new URL(window.location.href);
            Object.entries(filters).forEach(([k, v]) => {
              if (v && v !== 'all') url.searchParams.set(k, v);
              else url.searchParams.delete(k);
            });
            window.location.href = url.toString();
          }}
          initialFilters={{ startDate, endDate, category, search: searchQuery }}
        />

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl shadow">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Description</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">No transactions found.</td>
                </tr>
              ) : (
                transactions?.map((tx, idx) => (
                  <tr key={tx.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                    <td className="px-6 py-3">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                    <td className="px-6 py-3">{tx.description}</td>
                    <td className={`px-6 py-3 text-right font-mono font-medium ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₱{Math.abs(tx.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 capitalize">{tx.category}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Documents */}
      <section>
        <h2 className="text-lg font-semibold mb-3">📁 Official Documents</h2>
        {!posts?.length && <p className="text-gray-500">No documents posted yet.</p>}
        <div className="grid gap-4">
          {posts?.map(post => (
            <div key={post.id} className="card p-5">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <h3 className="font-semibold text-lg">{post.title}</h3>
                <span className="badge badge-category">{post.category}</span>
              </div>
              <p className="text-gray-600 text-sm mt-2">{post.content}</p>
              <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                <span>{new Date(post.published_at).toLocaleDateString()}</span>
                {post.file_url && (
                  <a href={post.file_url} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1">
                    <span>{getFileIcon(post.file_url)}</span> Download
                  </a>
                )}
              </div>
              {isAdmin && (
                <form action={deletePost} className="mt-3">
                  <input type="hidden" name="id" value={post.id} />
                  <button type="submit" className="text-xs text-red-500 hover:underline">Delete</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
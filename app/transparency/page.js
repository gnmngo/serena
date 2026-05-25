import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { getUserRole } from '@/utils/getUserRole';
import StatsCard from '@/components/ui/StatsCard';
import { DocumentTextIcon, CurrencyDollarIcon, ChartPieIcon } from '@heroicons/react/24/outline';
import ExportButton from '@/components/ExportButton';
import DocumentCard from '@/components/DocumentCard';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function deletePost(formData) {
  'use server';
  const id = formData.get('id');
  const supabase = await createClient();
  await supabase.from('transparency_posts').delete().eq('id', id);
  revalidatePath('/transparency');
  redirect('/transparency');
}

async function adjustBalance(formData) {
  'use server';
  const amount = parseFloat(formData.get('amount'));
  const description = formData.get('description');
  if (isNaN(amount)) return;
  const supabase = await createClient();
  await supabase.from('budget_transactions').insert({
    transaction_date: new Date(),
    description: description || `Manual adjustment`,
    amount: amount,
    category: 'allocation',
  });
  revalidatePath('/transparency');
}

export default async function TransparencyPage() {
  const supabase = await createClient();
  const role = await getUserRole();
  const isAdmin = role === 'admin';

  const { data: posts } = await supabase
    .from('transparency_posts')
    .select('*')
    .order('published_at', { ascending: false });
  const { data: transactions } = await supabase
    .from('budget_transactions')
    .select('*')
    .order('transaction_date', { ascending: false });

  const totalIncome = transactions?.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) || 0;
  const totalExpenses = transactions?.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0) || 0;
  const balance = totalIncome - totalExpenses;

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Transparency Board</h1>
        {isAdmin && <Link href="/transparency/new" className="btn-primary">+ Add Post</Link>}
      </div>

      {/* Stats Cards with prominent balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Total Income" value={`₱${totalIncome.toLocaleString()}`} icon={<CurrencyDollarIcon className="w-6 h-6" />} color="success" />
        <StatsCard title="Total Expenses" value={`₱${totalExpenses.toLocaleString()}`} icon={<ChartPieIcon className="w-6 h-6" />} color="danger" />
        <div className="bg-white rounded-xl shadow-md p-6 border-l-8 border-[#343434]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">💰 Current CEC SC Funds</p>
              <p className="text-3xl font-bold text-[#343434] mt-1">₱{balance.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-100">
              <DocumentTextIcon className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Manual Adjustment Form */}
      {isAdmin && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-md font-semibold mb-3 flex items-center gap-2">⚙️ Manual Fund Adjustment</h3>
          <form action={adjustBalance} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs text-gray-500 mb-1">Amount (positive = add, negative = deduct)</label>
              <input type="number" step="0.01" name="amount" placeholder="e.g., 1000 or -500" className="w-full border p-2 rounded" required />
            </div>
            <div className="flex-[2] min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">Reason / Description</label>
              <input type="text" name="description" placeholder="e.g., Opening balance, correction" className="w-full border p-2 rounded" required />
            </div>
            <button type="submit" className="btn-secondary">Apply Adjustment</button>
          </form>
          <p className="text-xs text-gray-400 mt-2">This will add a transaction to the budget log.</p>
        </div>
      )}

      {/* Budget Transactions Table */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-800">💰 Budget Transactions</h2>
          <div className="flex gap-2">
            <ExportButton data={transactions || []} fileName="cec_budget.csv" />
            {isAdmin && <Link href="/admin/budget" className="text-sm text-primary hover:underline">Manage →</Link>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Description</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-600">Amount</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions?.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No transactions recorded yet.使用</td></tr>
              ) : (
                transactions?.map((tx, idx) => (
                  <tr key={tx.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                    <td className="px-6 py-3 whitespace-nowrap">{new Date(tx.transaction_date).toLocaleDateString()}</td>
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
      </section>

      {/* Official Documents with preview */}
      <section>
        <h2 className="text-lg font-semibold mb-3">📁 Official Documents</h2>
        {!posts?.length && <p className="text-gray-500 text-sm">No documents posted yet.</p>}
        <div className="grid gap-4">
          {posts?.map(post => (
            <DocumentCard key={post.id} post={post} isAdmin={isAdmin} deletePost={deletePost} />
          ))}
        </div>
      </section>
    </div>
  );
}
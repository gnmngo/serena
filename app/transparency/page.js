import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { getUserRole } from '@/utils/getUserRole';
import StatsCard from '@/components/ui/StatsCard';
import { DocumentTextIcon, CurrencyDollarIcon, ChartPieIcon } from '@heroicons/react/24/outline';
import ExportButton from '@/components/ExportButton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { revalidatePath } from 'next/cache';

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

  async function deletePost(formData) {
    'use server';
    const id = formData.get('id');
    const supabase = await createClient();
    await supabase.from('transparency_posts').delete().eq('id', id);
    revalidatePath('/transparency');
  }

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* Header with buttons */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Transparency Board</h1>
        <div className="flex gap-2">
          {isAdmin && <Link href="/transparency/new" className="btn-primary">+ Add Post</Link>}
          <ExportButton data={transactions || []} fileName="budget_transactions.csv" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Total Income" value={`₱${totalIncome.toLocaleString()}`} icon={<CurrencyDollarIcon className="w-6 h-6" />} color="success" />
        <StatsCard title="Total Expenses" value={`₱${totalExpenses.toLocaleString()}`} icon={<ChartPieIcon className="w-6 h-6" />} color="danger" />
        <StatsCard title="Remaining Balance" value={`₱${balance.toLocaleString()}`} icon={<DocumentTextIcon className="w-6 h-6" />} color="primary" />
      </div>

      {/* Budget Transactions Table – professional design */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-800">💰 Budget Transactions</h2>
          {isAdmin && <Link href="/admin/budget" className="text-sm text-primary hover:underline">Manage →</Link>}
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
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No transactions recorded yet.</td>
                </tr>
              ) : (
                transactions?.map((tx, idx) => (
                  <tr key={tx.id} className={idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/30 hover:bg-gray-50'}>
                    <td className="px-6 py-3 whitespace-nowrap text-gray-700">
                      {new Date(tx.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{tx.description}</td>
                    <td className={`px-6 py-3 text-right font-mono font-medium ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₱{Math.abs(tx.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 capitalize text-gray-500">{tx.category}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Official Documents Section */}
      <section>
        <h2 className="text-lg font-semibold mb-3">📁 Official Documents</h2>
        {!posts?.length && <p className="text-gray-500 text-sm">No documents posted yet.</p>}
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
                {post.file_url && <a href={post.file_url} target="_blank" className="text-blue-500 hover:underline">📎 Attachment</a>}
              </div>
              {isAdmin && (
                <div className="mt-3">
                  <form action={deletePost}>
                    <input type="hidden" name="id" value={post.id} />
                    <button type="submit" className="text-xs text-red-500 hover:underline">Delete</button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
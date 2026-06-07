'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { logActivityAction } from '@/actions/logActivity';

export default function BudgetTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    transaction_date: '',
    description: '',
    amount: '',
    category: 'expense'
  });
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const supabase = createClient();

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    const { data } = await supabase
      .from('budget_transactions')
      .select('*')
      .order('transaction_date', { ascending: false });
    setTransactions(data || []);
    setLoading(false);
  }

  async function addTransaction(e) {
    e.preventDefault();
    const amountNum = parseFloat(form.amount);
    if (isNaN(amountNum)) {
      toast.error('Invalid amount');
      return;
    }

    const { data: inserted, error } = await supabase
      .from('budget_transactions')
      .insert({
        transaction_date: form.transaction_date,
        description: form.description,
        amount: amountNum,
        category: form.category,
      })
      .select();

    if (error) {
      toast.error('Error adding transaction');
    } else {
      toast.success('Transaction added');
      if (inserted && inserted.length > 0) {
        await logActivityAction({
          action: 'INSERT',
          entityType: 'budget_transaction',
          entityId: inserted[0].id,
          newData: {
            amount: amountNum,
            description: form.description,
            category: form.category,
            date: form.transaction_date,
          },
          amount: amountNum,
        });
      }
      setForm({
        transaction_date: '',
        description: '',
        amount: '',
        category: 'expense',
      });
      fetchTransactions();
    }
  }

  async function deleteTransaction(id) {
    const { data: toDelete } = await supabase
      .from('budget_transactions')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('budget_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error deleting');
    } else {
      toast.success('Transaction deleted');
      await logActivityAction({
        action: 'DELETE',
        entityType: 'budget_transaction',
        entityId: id,
        oldData: {
          amount: toDelete.amount,
          description: toDelete.description,
          category: toDelete.category,
          date: toDelete.transaction_date,
        },
        amount: toDelete.amount,
      });
      fetchTransactions();
    }
  }

  if (loading) return <div className="p-8 text-center">Loading transactions...</div>;

  if (!transactions.length) {
    return (
      <div className="space-y-6 animate-fadeInUp">
        <h1 className="text-3xl font-bold">Budget Transactions</h1>
        <form onSubmit={addTransaction} className="bg-white p-4 rounded-xl shadow mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input type="date" className="border p-2 rounded" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} required />
          <input type="text" placeholder="Description" className="border p-2 rounded" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <input type="number" step="0.01" placeholder="Amount" className="border p-2 rounded" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <select className="border p-2 rounded" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="allocation">Allocation</option>
          </select>
          <button type="submit" className="bg-[#343434] text-white p-2 rounded col-span-full flex items-center justify-center gap-2"><Plus size={16} /> Add Transaction</button>
        </form>
        <EmptyState icon="💰" title="No transactions yet" description="Add your first budget transaction using the form above." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      <h1 className="text-3xl font-bold">Budget Transactions</h1>
      <form onSubmit={addTransaction} className="bg-white p-4 rounded-xl shadow mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input type="date" className="border p-2 rounded" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} required />
        <input type="text" placeholder="Description" className="border p-2 rounded" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <input type="number" step="0.01" placeholder="Amount" className="border p-2 rounded" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <select className="border p-2 rounded" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="allocation">Allocation</option>
        </select>
        <button type="submit" className="bg-[#343434] text-white p-2 rounded col-span-full flex items-center justify-center gap-2"><Plus size={16} /> Add Transaction</button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => (
              <tr key={tx.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                <td className="p-2">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                <td className="p-2">{tx.description}</td>
                <td className={`p-2 text-right font-mono ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₱{Math.abs(tx.amount).toLocaleString()}
                </td>
                <td className="p-2 capitalize">{tx.category}</td>
                <td className="p-2 text-center">
                  <button onClick={() => setDeleteModal({ open: true, id: tx.id, name: tx.description })} className="text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">No transactions found.使用
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: '' })}
        onConfirm={() => deleteTransaction(deleteModal.id)}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
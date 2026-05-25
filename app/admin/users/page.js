'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('id, email, role, full_name, student_id')
          .order('created_at', { ascending: false });
        if (fetchError) throw fetchError;
        setUsers(data || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  async function deleteUser(userId) {
    if (!confirm('Are you sure? This will permanently delete the user.')) return;
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('User deleted');
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch (err) {
      toast.error('Network error: ' + err.message);
    }
  }

  if (loading) return <div className="p-8">Loading users...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading users: {error}</div>;

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <Link href="/admin/dashboard" className="btn-secondary">← Back to Dashboard</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Full Name</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Student ID</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.full_name || '-'}</td>
                <td className="p-3 capitalize">{user.role}</td>
                <td className="p-3">{user.student_id || '-'}</td>
                <td className="p-3 text-center">
                  <button onClick={() => deleteUser(user.id)} className="text-red-500 hover:text-red-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
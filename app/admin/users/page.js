'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { deleteUserAction } from '../../actions/deleteUser'; // relative import – correct!

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, userId: null, userEmail: '' });
  const supabase = createClient();

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
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  async function deleteUser(userId) {
    try {
      const result = await deleteUserAction(userId);
      if (result.success) {
        toast.success('User deleted');
        setUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (err) {
      toast.error(err.message);
    }
    setDeleteModal({ open: false, userId: null, userEmail: '' });
  }

  if (loading) return <div className="p-8">Loading users...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

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
                  <button
                    onClick={() => setDeleteModal({ open: true, userId: user.id, userEmail: user.email })}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, userId: null, userEmail: '' })}
        onConfirm={() => deleteUser(deleteModal.userId)}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteModal.userEmail}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

// Server action to delete a user (uses service role key)
async function deleteUser(formData) {
  'use server';
  const userId = formData.get('userId');
  if (!userId) return;

  // Use service role client (bypasses RLS)
  const supabaseAdmin = createClient(); // this uses the service role key via env var
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error('Delete user error:', error);
    throw new Error('Failed to delete user');
  }
  // Also delete from profiles (cascades or manual)
  await supabaseAdmin.from('profiles').delete().eq('id', userId);
  revalidatePath('/admin/users');
}

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/login');

  // Fetch all users (join auth.users with profiles)
  const { data: usersData } = await supabase
    .from('profiles')
    .select('id, email, role, full_name, student_id, created_at')
    .order('created_at', { ascending: false });

  // For email, we might also need auth.users email; profiles already has email

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
              <th className="p-3 text-left text-sm font-semibold">Email</th>
              <th className="p-3 text-left text-sm font-semibold">Full Name</th>
              <th className="p-3 text-left text-sm font-semibold">Role</th>
              <th className="p-3 text-left text-sm font-semibold">Student ID</th>
              <th className="p-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersData?.map(userRow => (
              <tr key={userRow.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3 text-sm">{userRow.email}</td>
                <td className="p-3 text-sm">{userRow.full_name || '-'}</td>
                <td className="p-3 text-sm capitalize">{userRow.role}</td>
                <td className="p-3 text-sm">{userRow.student_id || '-'}</td>
                <td className="p-3 text-center">
                  <form action={deleteUser}>
                    <input type="hidden" name="userId" value={userRow.id} />
                    <button
                      type="submit"
                      className="text-red-500 hover:text-red-700 text-sm"
                      onClick={() => confirm('Are you sure? This will permanently delete the user.')}
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
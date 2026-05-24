'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', section: '' });
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) {
        console.error('Fetch error:', error);
        toast.error('Could not load profile');
      } else {
        setProfile(data);
        setForm({ full_name: data?.full_name || '', section: data?.section || '' });
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Not logged in');
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: form.full_name, section: form.section })
      .eq('id', user.id);
    if (error) {
      console.error('Update error:', error);
      toast.error('Update failed: ' + error.message);
    } else {
      toast.success('Profile updated');
      // Reload the page to refresh sidebar and header
      window.location.reload();
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!profile) return <div className="p-8">Profile not found</div>;

  return (
    <div className="max-w-2xl mx-auto animate-fadeInUp">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      <div className="card p-6 space-y-4">
        <div><label className="text-sm text-gray-500">Student ID</label><p className="font-medium">{profile.student_id}</p></div>
        <div><label className="text-sm text-gray-500">Email</label><p className="font-medium">{profile.email}</p></div>
        <div><label className="text-sm text-gray-500">Role</label><p className="font-medium capitalize">{profile.role}</p></div>
        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Full Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={form.full_name}
                onChange={e => setForm({...form, full_name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Section</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={form.section}
                onChange={e => setForm({...form, section: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div><label className="text-sm text-gray-500">Full Name</label><p className="font-medium">{profile.full_name || 'Not set'}</p></div>
            <div><label className="text-sm text-gray-500">Section</label><p className="font-medium">{profile.section || 'Not set'}</p></div>
            <button onClick={() => setEditing(true)} className="btn-primary">Edit Profile</button>
          </>
        )}
      </div>
    </div>
  );
}
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role || 'student';
  if (role === 'admin') redirect('/admin/dashboard');
  if (role === 'faculty') redirect('/faculty/dashboard');
  redirect('/student/dashboard');
}
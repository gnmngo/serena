'use server';
import { createClient } from '@supabase/supabase-js';

export async function deleteUserAction(userId) {
  if (!userId) throw new Error('User ID required');

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete user: ${error.message}`);
  }

  // Also delete from profiles (optional, cascade may handle)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  await supabase.from('profiles').delete().eq('id', userId);

  return { success: true };
}
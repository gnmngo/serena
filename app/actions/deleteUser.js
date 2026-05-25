'use server';
import { createClient } from '@supabase/supabase-js';

export async function deleteUserAction(userId) {
  if (!userId) {
    throw new Error('User ID required');
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Delete from auth.users
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authError) {
    console.error('Auth error:', authError);
    throw new Error(`Failed to delete user: ${authError.message}`);
  }

  // Delete from profiles (optional, cascade might handle)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  await supabase.from('profiles').delete().eq('id', userId);

  return { success: true };
}
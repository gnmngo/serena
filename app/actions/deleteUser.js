'use server';
import { createClient } from '@supabase/supabase-js';

export async function deleteUserAction(userId) {
  // Log environment variable presence (will appear in Vercel function logs)
  console.log('Deleting user:', userId);
  console.log('Has service role key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!userId) {
    throw new Error('User ID required');
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error('Delete error:', error);
    throw new Error(`Delete failed: ${error.message}`);
  }

  return { success: true };
}
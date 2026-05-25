'use server';
import { createClient } from '@/utils/supabase/server';

export async function deleteUserAction(userId) {
  if (!userId) {
    throw new Error('User ID required');
  }

  const supabase = await createClient(); // regular client (uses anon key)

  // Call the secure database function
  const { data, error } = await supabase.rpc('delete_user_by_id', { user_id: userId });

  if (error) {
    console.error('RPC error:', error);
    throw new Error(`Failed to delete user: ${error.message}`);
  }

  if (!data) {
    throw new Error('User not found');
  }

  return { success: true };
}
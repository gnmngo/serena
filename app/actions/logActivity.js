'use server';
import { createClient } from '@/utils/supabase/server';

export async function logActivityAction({ action, entityType, entityId, oldData, newData, amount }) {
  // Debug: log the amount to Vercel function logs
  console.log('[logActivity] Received amount:', amount);
  let numericAmount = null;
  if (amount !== undefined && amount !== null) {
    const parsed = parseFloat(amount);
    if (!isNaN(parsed)) numericAmount = parsed;
  }
  console.log('[logActivity] Storing amount:', numericAmount);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const { error } = await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      user_role: profile?.role || 'unknown',
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_data: oldData,
      new_data: newData,
      amount: numericAmount,
    });
    if (error) console.error('[logActivity] Insert error:', error);
  } catch (err) {
    console.error('[logActivity] Exception:', err);
  }
}
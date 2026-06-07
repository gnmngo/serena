'use server';
import { createClient } from '@/utils/supabase/server';

export async function logActivityAction({ action, entityType, entityId, oldData, newData, amount = null }) {
  console.log('logActivityAction called with amount:', amount); // debug
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const numericAmount = (amount !== null && amount !== undefined && !isNaN(parseFloat(amount))) ? parseFloat(amount) : null;

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
    if (error) console.error('Insert error:', error);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
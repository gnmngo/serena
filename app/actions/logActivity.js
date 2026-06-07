'use server';
import { createClient } from '@/utils/supabase/server';

export async function logActivityAction({ action, entityType, entityId, oldData, newData, amount }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const numericAmount = (amount !== undefined && amount !== null && !isNaN(parseFloat(amount))) 
      ? parseFloat(amount) 
      : null;

    await supabase.from('activity_logs').insert({
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
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
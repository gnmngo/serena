'use server';
import { createClient } from '@/utils/supabase/server';

export async function logActivityAction({
  action,           // 'create', 'delete', 'update'
  entityType,       // 'budget_transaction', 'announcement', etc.
  entityName,       // human‑readable name (e.g. "CEC Week Venue")
  entityId,
  amount = null,
  oldData = null,
  newData = null,
  severity = 'MEDIUM'
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.full_name || user.email.split('@')[0];
    const userRole = profile?.role || 'unknown';

    // --- Build a human‑readable description ---
    let humanDescription = '';
    if (entityType === 'budget_transaction') {
      const amountStr = amount ? `₱${Number(amount).toLocaleString()}` : 'an amount';
      const desc = entityName || (newData?.description || oldData?.description || 'transaction');
      const cat = (newData?.category || oldData?.category || 'transaction').toUpperCase();
      if (action === 'create') {
        humanDescription = `${userName} recorded a ${cat} transaction of ${amountStr} for “${desc}”.`;
      } else if (action === 'delete') {
        humanDescription = `${userName} deleted a ${cat} transaction of ${amountStr} for “${desc}”.`;
      } else {
        humanDescription = `${userName} ${action}d a ${cat} transaction.`;
      }
    } else {
      humanDescription = `${userName} ${action}d ${entityName || entityType}.`;
    }

    // --- Insert the log with the human description ---
    const { error } = await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      user_role: userRole,
      action,
      entity_type: entityType,
      entity_name: entityName,
      entity_id: entityId,
      amount: amount ? parseFloat(amount) : null,
      old_data: oldData,
      new_data: newData,
      severity,
      human_description: humanDescription,
    });
    if (error) console.error('Audit insert error:', error);
  } catch (err) {
    console.error('Audit exception:', err);
  }
}
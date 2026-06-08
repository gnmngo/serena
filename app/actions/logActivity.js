'use server';
import { createClient } from '@/utils/supabase/server';

export async function logActivityAction({
  action,           // 'create', 'update', 'delete', 'approve', 'reject', 'release'
  entityType,       // 'budget_transaction', 'announcement', etc.
  entityName,
  entityId,
  amount = null,
  oldData = null,
  newData = null,
  severity = 'MEDIUM',
  justification = null
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

    // Build human-readable summary
    let actionSummary = '';
    if (entityType === 'budget_transaction') {
      const amountStr = amount ? `₱${Number(amount).toLocaleString()}` : 'an amount';
      const desc = entityName;
      if (action === 'create') {
        actionSummary = `${userName} recorded a ${newData?.category?.toUpperCase() || 'transaction'} of ${amountStr} for “${desc}”.`;
      } else if (action === 'delete') {
        actionSummary = `${userName} deleted a ${oldData?.category?.toUpperCase() || 'transaction'} of ${amountStr} for “${desc}”.`;
      } else if (action === 'update') {
        const oldAmount = oldData?.amount ? `₱${Number(oldData.amount).toLocaleString()}` : 'an amount';
        const newAmount = newData?.amount ? `₱${Number(newData.amount).toLocaleString()}` : 'an amount';
        actionSummary = `${userName} updated ${desc} from ${oldAmount} to ${newAmount}.`;
      }
    } else {
      actionSummary = `${userName} ${action}d ${entityName || entityType}.`;
    }

    const referenceNumber = `BT-${Date.now()}`;
    const differenceAmount = (newData?.amount && oldData?.amount) ? newData.amount - oldData.amount : null;

    const { error } = await supabase.from('audit_trail').insert({
      reference_number: referenceNumber,
      user_id: user.id,
      user_name: userName,
      role: userRole,
      entity_type: entityType,
      action_type: action.charAt(0).toUpperCase() + action.slice(1),
      action_summary: actionSummary,
      amount: amount,
      old_data: oldData,
      new_data: newData,
      difference_amount: differenceAmount,
      justification,
      severity,
    });
    if (error) console.error('Audit insert error:', error);
  } catch (err) {
    console.error('Audit exception:', err);
  }
}
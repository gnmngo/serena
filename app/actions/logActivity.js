'use server';
import { createClient } from '@/utils/supabase/server';

export async function logActivityAction({
  action,
  entityType,
  entityName,
  entityId,
  amount = null,
  oldData = null,
  newData = null,
  severity = 'MEDIUM'
}) {
  console.log('[logActivityAction] called with:', { action, entityType, entityName, amount, severity });
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

    let humanDescription = '';
    let referenceNumber = null;

    if (entityType === 'budget_transaction') {
      const amountStr = amount ? `₱${Number(amount).toLocaleString()}` : 'an amount';
      const description = newData?.description || oldData?.description || '';
      const category = newData?.category || oldData?.category || 'transaction';
      if (action === 'create') {
        humanDescription = `${userName} recorded a ${category.toUpperCase()} transaction of ${amountStr} for “${description}”.`;
        referenceNumber = `BT-${Date.now()}`;
      } else if (action === 'delete') {
        humanDescription = `${userName} deleted a ${category} transaction of ${amountStr} for “${description}”.`;
      }
    } else if (entityType === 'announcement') {
      const title = newData?.title || oldData?.title || '';
      if (action === 'create') humanDescription = `${userName} posted announcement “${title}”.`;
      else if (action === 'delete') humanDescription = `${userName} removed announcement “${title}”.`;
    } else if (entityType === 'suggestion') {
      const title = newData?.title || oldData?.title || '';
      if (action === 'create') humanDescription = `${userName} submitted a suggestion “${title}”.`;
      else if (action === 'update') humanDescription = `${userName} updated suggestion “${title}”.`;
    } else if (entityType === 'transparency_post') {
      const title = newData?.title || oldData?.title || '';
      if (action === 'create') humanDescription = `${userName} uploaded a transparency report: “${title}”.`;
      else if (action === 'delete') humanDescription = `${userName} removed document “${title}”.`;
    } else if (entityType === 'event') {
      const title = newData?.title || oldData?.title || '';
      if (action === 'create') humanDescription = `${userName} created event “${title}”.`;
      else if (action === 'delete') humanDescription = `${userName} deleted event “${title}”.`;
    }

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
      reference_number: referenceNumber,
      human_description: humanDescription,
    });
    if (error) console.error('Insert error:', error);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
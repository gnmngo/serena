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
  console.log('=== logActivityAction called ===');
  console.log('action:', action);
  console.log('entityType:', entityType);
  console.log('entityName:', entityName);
  console.log('amount:', amount);
  console.log('severity:', severity);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user found');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.full_name || user.email.split('@')[0];
    const userRole = profile?.role || 'unknown';

    // Build human-readable description
    let humanDescription = '';
    if (entityType === 'budget_transaction') {
      const amountStr = amount ? `₱${Number(amount).toLocaleString()}` : 'an amount';
      const desc = newData?.description || oldData?.description || '';
      const cat = (newData?.category || oldData?.category || 'transaction').toUpperCase();
      if (action === 'create') {
        humanDescription = `${userName} recorded a ${cat} transaction of ${amountStr} for “${desc}”.`;
      } else if (action === 'delete') {
        humanDescription = `${userName} deleted a ${cat} transaction of ${amountStr} for “${desc}”.`;
      }
    } else {
      humanDescription = `${action} ${entityType}`;
    }

    const insertData = {
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
    };

    console.log('Inserting:', insertData);

    const { error } = await supabase.from('activity_logs').insert(insertData);
    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('Insert successful');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}
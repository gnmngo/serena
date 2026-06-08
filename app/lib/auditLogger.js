'use server';

import { createClient } from '@/utils/supabase/server';

export async function recordAudit({
  referenceNumber,
  userId,
  userName,
  userRole,
  entityType,
  actionType,
  actionSummary,
  amount = null,
  oldData = null,
  newData = null,
  differenceAmount = null,
  justification = null,
  severity = 'MEDIUM'
}) {
  try {
    const supabase = await createClient();
    // If userId not provided, get current user
    let actualUserId = userId;
    let actualUserName = userName;
    let actualUserRole = userRole;
    if (!actualUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        actualUserId = user.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();
        actualUserName = profile?.full_name || user.email.split('@')[0];
        actualUserRole = profile?.role || 'unknown';
      }
    }

    const { error } = await supabase.from('audit_trail').insert({
      reference_number: referenceNumber,
      user_id: actualUserId,
      user_name: actualUserName,
      role: actualUserRole,
      entity_type: entityType,
      action_type: actionType,
      action_summary: actionSummary,
      amount,
      old_data: oldData,
      new_data: newData,
      difference_amount: differenceAmount,
      justification,
      severity,
    });
    if (error) console.error('Audit log error:', error);
  } catch (err) {
    console.error('Audit exception:', err);
  }
}
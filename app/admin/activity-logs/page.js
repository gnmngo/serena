'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

function formatPHTime(utcDateString) {
  const date = new Date(utcDateString);
  const phTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return phTime.toLocaleString('en-PH', { hour12: true });
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from('activity_logs')
        .select('created_at, user_email, user_role, human_description, amount, severity, entity_name')
        .order('created_at', { ascending: false })
        .limit(100);
      setLogs(data || []);
      setLoading(false);
    }
    fetchLogs();
  }, []);

  if (loading) return <div className="p-8">Loading audit trail...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Governance Accountability Audit Trail</h1>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date & Time (PH)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Action Summary</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Entity</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Amount (₱)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Severity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 text-sm whitespace-nowrap">{formatPHTime(log.created_at)}</td>
                <td className="px-4 py-2 text-sm">{log.user_email}</td>
                <td className="px-4 py-2 text-sm capitalize">{log.user_role}</td>
                <td className="px-4 py-2 text-sm">{log.human_description || '—'}</td>
                <td className="px-4 py-2 text-sm">{log.entity_name || '—'}</td>
                <td className="px-4 py-2 text-sm text-right font-mono">
                  {log.amount ? `₱${log.amount.toLocaleString()}` : '-'}
                </td>
                <td className="px-4 py-2 text-sm">{log.severity || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="text-center py-8 text-gray-500">No audit records found.</div>}
      </div>
    </div>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

function formatPHTime(utcDateString) {
  const date = new Date(utcDateString);
  const phTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return phTime.toLocaleString('en-PH', { hour12: true });
}

function getHumanDescription(log) {
  // Parse JSON fields (they may be strings or objects)
  let newData = log.new_data;
  let oldData = log.old_data;
  try {
    if (typeof newData === 'string') newData = JSON.parse(newData);
    if (typeof oldData === 'string') oldData = JSON.parse(oldData);
  } catch (e) {}

  if (log.entity_type === 'budget_transaction') {
    // Use the dedicated amount column
    const amountValue = log.amount !== null && log.amount !== undefined ? `₱${Number(log.amount).toLocaleString()}` : 'an amount';
    if (log.action === 'INSERT' && newData) {
      const desc = newData.description || 'no description';
      const cat = newData.category || 'transaction';
      const date = newData.date ? new Date(newData.date).toLocaleDateString() : 'unknown date';
      return `Added ${cat}: ${amountValue} for “${desc}” on ${date}`;
    }
    if (log.action === 'DELETE' && oldData) {
      const desc = oldData.description || 'no description';
      const cat = oldData.category || 'transaction';
      const date = oldData.date ? new Date(oldData.date).toLocaleDateString() : 'unknown date';
      return `Removed ${cat}: ${amountValue} for “${desc}” on ${date}`;
    }
  }
  if (log.action === 'INSERT') return `Created a new ${log.entity_type.replace('_', ' ')}`;
  if (log.action === 'DELETE') return `Deleted a ${log.entity_type.replace('_', ' ')}`;
  return `${log.action} ${log.entity_type}`;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    search: '',
    action: 'all',
    userRole: 'all',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;
  const supabase = createClient();

  useEffect(() => {
    fetchLogs();
  }, [filter, page]);

  async function fetchLogs() {
    setLoading(true);
    let query = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (filter.search) {
      query = query.or(`action.ilike.%${filter.search}%,user_email.ilike.%${filter.search}%,entity_type.ilike.%${filter.search}%`);
    }
    if (filter.action !== 'all') query = query.eq('action', filter.action);
    if (filter.userRole !== 'all') query = query.eq('user_role', filter.userRole);
    if (filter.startDate) query = query.gte('created_at', filter.startDate);
    if (filter.endDate) query = query.lte('created_at', `${filter.endDate} 23:59:59`);

    const { data, error, count } = await query;
    if (error) toast.error('Error fetching logs');
    else {
      setLogs(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(logs.map(log => ({
      'Date and Time (PH)': formatPHTime(log.created_at),
      'User': log.user_email,
      'Role': log.user_role,
      'Action': log.action === 'INSERT' ? 'Created' : (log.action === 'DELETE' ? 'Deleted' : log.action),
      'Entity': log.entity_type === 'budget_transaction' ? 'Budget Transaction' : log.entity_type,
      'Amount (₱)': log.amount !== null && log.amount !== undefined ? log.amount.toLocaleString() : '',
      'Description': getHumanDescription(log),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activity Logs');
    XLSX.writeFile(wb, `activity_logs_${new Date().toISOString()}.xlsx`);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <Button onClick={exportToExcel}><Download className="mr-2 h-4 w-4" /> Export Excel</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search..." value={filter.search} onChange={(e) => setFilter({...filter, search: e.target.value})} className="pl-9" />
            </div>
            <Select value={filter.action} onValueChange={(val) => setFilter({...filter, action: val})}>
              <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="INSERT">Created</SelectItem>
                <SelectItem value="DELETE">Deleted</SelectItem>
                <SelectItem value="UPDATE">Updated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filter.userRole} onValueChange={(val) => setFilter({...filter, userRole: val})}>
              <SelectTrigger><SelectValue placeholder="User Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input type="date" placeholder="Start date" value={filter.startDate} onChange={(e) => setFilter({...filter, startDate: e.target.value})} />
              <Input type="date" placeholder="End date" value={filter.endDate} onChange={(e) => setFilter({...filter, endDate: e.target.value})} />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading logs...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date and Time (PH)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Entity</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Amount (₱)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm whitespace-nowrap">{formatPHTime(log.created_at)}</td>
                    <td className="px-4 py-2 text-sm">{log.user_email}</td>
                    <td className="px-4 py-2 text-sm capitalize">{log.user_role}</td>
                    <td className="px-4 py-2 text-sm">{log.action === 'INSERT' ? 'Created' : (log.action === 'DELETE' ? 'Deleted' : log.action)}</td>
                    <td className="px-4 py-2 text-sm">{log.entity_type === 'budget_transaction' ? 'Budget Transaction' : log.entity_type}</td>
                    <td className="px-4 py-2 text-sm text-right font-mono">
                      {log.amount !== null && log.amount !== undefined ? `₱${log.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-2 text-sm">{getHumanDescription(log)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">Total: {totalCount} records</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p-1)}>Previous</Button>
              <span className="py-2 px-3">Page {page} of {totalPages}</span>
              <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p+1)}>Next</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
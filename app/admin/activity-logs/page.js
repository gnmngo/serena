'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Eye, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

function formatPHTime(utcDateString) {
  const date = new Date(utcDateString);
  const phTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return phTime.toLocaleString('en-PH', { hour12: true });
}

function getSeverityBadge(severity) {
  const styles = {
    LOW: 'bg-gray-100 text-gray-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
  };
  return <Badge className={styles[severity] || 'bg-gray-100'}>{severity}</Badge>;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    search: '',
    action: 'all',
    userRole: 'all',
    severity: 'all',
    startDate: '',
    endDate: '',
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;
  const supabase = createClient();

  // Financial summary
  const [financialStats, setFinancialStats] = useState({
    totalActions: 0,
    totalAmount: 0,
    additions: 0,
    deletions: 0,
    critical: 0,
    topAdmin: '',
  });

  useEffect(() => {
    fetchLogs();
    fetchFinancialStats();
  }, [filter, page]);

  async function fetchLogs() {
    setLoading(true);
    let query = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (filter.search) {
      query = query.or(`human_description.ilike.%${filter.search}%,user_email.ilike.%${filter.search}%,entity_name.ilike.%${filter.search}%`);
    }
    if (filter.action !== 'all') query = query.eq('action', filter.action);
    if (filter.userRole !== 'all') query = query.eq('user_role', filter.userRole);
    if (filter.severity !== 'all') query = query.eq('severity', filter.severity);
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

  async function fetchFinancialStats() {
    const { data } = await supabase
      .from('activity_logs')
      .select('action, amount, user_email, severity')
      .eq('entity_type', 'budget_transaction');
    if (!data) return;
    const totalAmount = data.reduce((sum, l) => sum + (l.amount || 0), 0);
    const additions = data.filter(l => l.action === 'create').length;
    const deletions = data.filter(l => l.action === 'delete').length;
    const critical = data.filter(l => l.severity === 'CRITICAL').length;
    const userCounts = {};
    data.forEach(l => { userCounts[l.user_email] = (userCounts[l.user_email] || 0) + 1; });
    const topAdmin = Object.entries(userCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
    setFinancialStats({
      totalActions: data.length,
      totalAmount,
      additions,
      deletions,
      critical,
      topAdmin,
    });
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(logs.map(log => ({
      'Date & Time (PH)': formatPHTime(log.created_at),
      'User': log.user_email,
      'Role': log.user_role,
      'Action Summary': log.human_description || `${log.action} ${log.entity_type}`,
      'Entity': log.entity_name,
      'Amount (₱)': log.amount ? log.amount.toLocaleString() : '',
      'Severity': log.severity,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activity Logs');
    XLSX.writeFile(wb, `audit_logs_${new Date().toISOString()}.xlsx`);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6 animate-fadeInUp">
      <h1 className="text-3xl font-bold">Governance Accountability Audit Trail</h1>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Total Financial Actions</p><p className="text-2xl font-bold">{financialStats.totalActions}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Total Amount Processed</p><p className="text-2xl font-bold text-green-600">₱{financialStats.totalAmount.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Budget Additions</p><p className="text-2xl font-bold text-blue-600">{financialStats.additions}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Budget Deletions</p><p className="text-2xl font-bold text-red-600">{financialStats.deletions}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Critical Actions</p><p className="text-2xl font-bold text-red-500">{financialStats.critical}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search..." value={filter.search} onChange={(e) => setFilter({...filter, search: e.target.value})} className="pl-9" /></div>
            <Select value={filter.action} onValueChange={(val) => setFilter({...filter, action: val})}><SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger><SelectContent><SelectItem value="all">All Actions</SelectItem><SelectItem value="create">Create</SelectItem><SelectItem value="update">Update</SelectItem><SelectItem value="delete">Delete</SelectItem></SelectContent></Select>
            <Select value={filter.userRole} onValueChange={(val) => setFilter({...filter, userRole: val})}><SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger><SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="faculty">Faculty</SelectItem><SelectItem value="student">Student</SelectItem></SelectContent></Select>
            <Select value={filter.severity} onValueChange={(val) => setFilter({...filter, severity: val})}><SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="LOW">Low</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="CRITICAL">Critical</SelectItem></SelectContent></Select>
            <div className="flex gap-2"><Input type="date" placeholder="Start date" value={filter.startDate} onChange={(e) => setFilter({...filter, startDate: e.target.value})} /><Input type="date" placeholder="End date" value={filter.endDate} onChange={(e) => setFilter({...filter, endDate: e.target.value})} /></div>
            <Button onClick={exportToExcel}><Download className="mr-2 h-4 w-4" /> Export</Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline / Table */}
      {loading ? (
        <div className="text-center py-8">Loading audit trail...</div>
      ) : (
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
                <th className="px-4 py-3 text-center text-sm font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm whitespace-nowrap">{formatPHTime(log.created_at)}</td>
                  <td className="px-4 py-2 text-sm">{log.user_email}</td>
                  <td className="px-4 py-2 text-sm capitalize">{log.user_role}</td>
                  <td className="px-4 py-2 text-sm">{log.human_description || `${log.action} ${log.entity_type}`}</td>
                  <td className="px-4 py-2 text-sm">{log.entity_name || '-'}</td>
                  <td className="px-4 py-2 text-sm text-right font-mono">
                    {log.amount ? <span className={log.action === 'create' ? 'text-green-600' : 'text-red-600'}>₱{log.amount.toLocaleString()}</span> : '-'}
                  </td>
                  <td className="px-4 py-2 text-sm">{getSeverityBadge(log.severity)}</td>
                  <td className="px-4 py-2 text-center">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedLog(log); setShowDetails(true); }}><Eye className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <div className="text-center py-8 text-gray-500">No audit records found.</div>}
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">Total: {totalCount} records</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p-1)}>Previous</Button>
              <span className="py-2 px-3">Page {page} of {totalPages}</span>
              <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p+1)}>Next</Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Audit Record Details</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="space-y-2">
              <p><strong>Performed By:</strong> {selectedLog.user_email} ({selectedLog.user_role})</p>
              <p><strong>Date & Time:</strong> {formatPHTime(selectedLog.created_at)}</p>
              <p><strong>Action:</strong> {selectedLog.human_description || `${selectedLog.action} ${selectedLog.entity_type}`}</p>
              <p><strong>Entity:</strong> {selectedLog.entity_name || '-'}</p>
              <p><strong>Amount:</strong> {selectedLog.amount ? `₱${selectedLog.amount.toLocaleString()}` : '-'}</p>
              <p><strong>Severity:</strong> {selectedLog.severity}</p>
              {selectedLog.old_data && <p><strong>Old Value:</strong> <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(selectedLog.old_data, null, 2)}</pre></p>}
              {selectedLog.new_data && <p><strong>New Value:</strong> <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(selectedLog.new_data, null, 2)}</pre></p>}
              {selectedLog.reference_number && <p><strong>Reference Number:</strong> {selectedLog.reference_number}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
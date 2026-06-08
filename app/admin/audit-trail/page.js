'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Eye, X } from 'lucide-react';
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

export default function AuditTrailPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    search: '',
    actionType: 'all',
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

  const [stats, setStats] = useState({
    totalActions: 0,
    totalAmount: 0,
    approvals: 0,
    rejections: 0,
    updates: 0,
    critical: 0,
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filter, page]);

  async function fetchLogs() {
    setLoading(true);
    let query = supabase
      .from('audit_trail')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (filter.search) {
      query = query.or(`action_summary.ilike.%${filter.search}%,user_name.ilike.%${filter.search}%,reference_number.ilike.%${filter.search}%`);
    }
    if (filter.actionType !== 'all') query = query.eq('action_type', filter.actionType);
    if (filter.severity !== 'all') query = query.eq('severity', filter.severity);
    if (filter.startDate) query = query.gte('created_at', filter.startDate);
    if (filter.endDate) query = query.lte('created_at', `${filter.endDate} 23:59:59`);

    const { data, error, count } = await query;
    if (error) toast.error('Error fetching audit records');
    else {
      setLogs(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  async function fetchStats() {
    const { data } = await supabase
      .from('audit_trail')
      .select('action_type, amount, severity');
    if (!data) return;
    const totalAmount = data.reduce((sum, l) => sum + (l.amount || 0), 0);
    const approvals = data.filter(l => l.action_type === 'Approve').length;
    const rejections = data.filter(l => l.action_type === 'Reject').length;
    const updates = data.filter(l => l.action_type === 'Update').length;
    const critical = data.filter(l => l.severity === 'CRITICAL').length;
    setStats({
      totalActions: data.length,
      totalAmount,
      approvals,
      rejections,
      updates,
      critical,
    });
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(logs.map(log => ({
      'Reference Number': log.reference_number,
      'Date & Time (PH)': formatPHTime(log.created_at),
      'User': log.user_name,
      'Role': log.role,
      'Action': log.action_type,
      'Entity': log.entity_type,
      'Summary': log.action_summary,
      'Amount (₱)': log.amount ? log.amount.toLocaleString() : '',
      'Severity': log.severity,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Trail');
    XLSX.writeFile(wb, `audit_trail_${new Date().toISOString()}.xlsx`);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6 animate-fadeInUp">
      <h1 className="text-3xl font-bold">Governance Accountability Audit Trail</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Financial Actions</p><p className="text-2xl font-bold">{stats.totalActions}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Amount Processed</p><p className="text-2xl font-bold text-green-600">₱{stats.totalAmount.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Approvals Issued</p><p className="text-2xl font-bold text-emerald-600">{stats.approvals}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Rejected Requests</p><p className="text-2xl font-bold text-rose-600">{stats.rejections}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Budget Updates</p><p className="text-2xl font-bold text-blue-600">{stats.updates}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Critical Actions</p><p className="text-2xl font-bold text-red-500">{stats.critical}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={filter.search} onChange={(e) => setFilter({...filter, search: e.target.value})} className="pl-9" /></div>
            <Select value={filter.actionType} onValueChange={(val) => setFilter({...filter, actionType: val})}><SelectTrigger><SelectValue placeholder="Action Type" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Create">Create</SelectItem><SelectItem value="Update">Update</SelectItem><SelectItem value="Delete">Delete</SelectItem><SelectItem value="Approve">Approve</SelectItem><SelectItem value="Reject">Reject</SelectItem><SelectItem value="Release">Release</SelectItem></SelectContent></Select>
            <Select value={filter.severity} onValueChange={(val) => setFilter({...filter, severity: val})}><SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="LOW">Low</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="CRITICAL">Critical</SelectItem></SelectContent></Select>
            <div className="flex gap-2"><Input type="date" placeholder="Start date" value={filter.startDate} onChange={(e) => setFilter({...filter, startDate: e.target.value})} /><Input type="date" placeholder="End date" value={filter.endDate} onChange={(e) => setFilter({...filter, endDate: e.target.value})} /></div>
            <Button onClick={exportToExcel}><Download className="mr-2 h-4 w-4" /> Export Excel</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading audit records...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Reference #</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date & Time (PH)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Entity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Summary</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Amount (₱)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Severity</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.audit_id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-mono">{log.reference_number}</td>
                    <td className="px-4 py-2 text-sm whitespace-nowrap">{formatPHTime(log.created_at)}</td>
                    <td className="px-4 py-2 text-sm">{log.user_name}</td>
                    <td className="px-4 py-2 text-sm capitalize">{log.role}</td>
                    <td className="px-4 py-2 text-sm">{log.action_type}</td>
                    <td className="px-4 py-2 text-sm">{log.entity_type}</td>
                    <td className="px-4 py-2 text-sm max-w-md truncate">{log.action_summary}</td>
                    <td className="px-4 py-2 text-sm text-right font-mono">{log.amount ? `₱${log.amount.toLocaleString()}` : '-'}</td>
                    <td className="px-4 py-2 text-sm">{getSeverityBadge(log.severity)}</td>
                    <td className="px-4 py-2 text-center">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedLog(log); setShowDetails(true); }}><Eye className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && <div className="text-center py-8 text-muted-foreground">No audit records found.</div>}
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-muted-foreground">Total: {totalCount} records</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p-1)}>Previous</Button>
              <span className="py-2 px-3">Page {page} of {totalPages}</span>
              <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p+1)}>Next</Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Audit Record Details</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div><p className="text-sm font-medium">Reference Number</p><p className="font-mono">{selectedLog.reference_number}</p></div>
              <div><p className="text-sm font-medium">Date & Time (PH)</p><p>{formatPHTime(selectedLog.created_at)}</p></div>
              <div><p className="text-sm font-medium">User</p><p>{selectedLog.user_name} ({selectedLog.role})</p></div>
              <div><p className="text-sm font-medium">Action Type</p><p>{selectedLog.action_type}</p></div>
              <div><p className="text-sm font-medium">Entity</p><p>{selectedLog.entity_type}</p></div>
              <div><p className="text-sm font-medium">Severity</p><p>{selectedLog.severity}</p></div>
              <div><p className="text-sm font-medium">Action Summary</p><p>{selectedLog.action_summary}</p></div>
              {selectedLog.old_data && selectedLog.new_data && (
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Change History</p>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                    <div><p className="text-xs text-gray-500">Before</p><pre className="text-sm">{JSON.stringify(selectedLog.old_data, null, 2)}</pre></div>
                    <div><p className="text-xs text-gray-500">After</p><pre className="text-sm">{JSON.stringify(selectedLog.new_data, null, 2)}</pre></div>
                  </div>
                  {selectedLog.difference_amount !== null && (
                    <div className="mt-2 text-right">
                      <span className={`text-sm font-mono ${selectedLog.difference_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Difference: ₱{Math.abs(selectedLog.difference_amount).toLocaleString()} {selectedLog.difference_amount >= 0 ? 'increase' : 'decrease'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import BackButton from '@/components/ui/BackButton';

const statusColors = {
  draft: 'bg-gray-200 text-gray-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  funded: 'bg-emerald-100 text-emerald-800',
  liquidated: 'bg-purple-100 text-purple-800',
};

export default function BudgetRequestDetail({ params }) {
  const [request, setRequest] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    setRole(profile?.role);

    const { data, error } = await supabase
      .from('budget_requests')
      .select('*')
      .eq('id', params.id)
      .single();
    if (error) {
      console.error(error);
    } else {
      setRequest(data);
      setNewStatus(data.status);
    }
    setLoading(false);
  }

  async function updateStatus() {
    if (newStatus === request.status) return;
    const { error } = await supabase
      .from('budget_requests')
      .update({ status: newStatus, updated_at: new Date() })
      .eq('id', params.id);
    if (error) toast.error('Error updating status');
    else {
      toast.success(`Status updated to ${newStatus}`);
      fetchData();
      // Also add approval record
      await supabase.from('budget_request_approvals').insert({
        request_id: params.id,
        approver_id: (await supabase.auth.getUser()).data.user?.id,
        approver_role: role,
        action: newStatus === 'approved' ? 'approve' : (newStatus === 'rejected' ? 'reject' : 'request_changes'),
        comments: comment,
      });
      setComment('');
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (!request) return <div className="p-8">Request not found</div>;

  const isAdmin = role === 'admin';
  const canApprove = isAdmin && (request.status === 'submitted' || request.status === 'under_review');

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeInUp">
      <BackButton fallbackUrl="/budget-requests" />
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">{request.title}</h1>
        <Badge className={statusColors[request.status]}>{request.status.replace('_', ' ')}</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle>Request Information</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><span className="font-medium">Amount:</span> ₱{request.amount.toLocaleString()}</div>
          <div><span className="font-medium">Category:</span> {request.category || 'N/A'}</div>
          <div><span className="font-medium">Organization:</span> {request.organization || 'N/A'}</div>
          <div><span className="font-medium">Submitted by:</span> {request.requester_name} ({request.requester_email})</div>
          <div><span className="font-medium">Description:</span></div>
          <p className="text-gray-700 whitespace-pre-wrap">{request.description || 'No description provided.'}</p>
          <div className="text-sm text-gray-400">Submitted on: {new Date(request.created_at).toLocaleString()}</div>
          {request.approved_at && <div>Approved on: {new Date(request.approved_at).toLocaleString()}</div>}
          {request.funded_at && <div>Funded on: {new Date(request.funded_at).toLocaleString()}</div>}
          {request.review_notes && <div><span className="font-medium">Review Notes:</span> {request.review_notes}</div>}
          {request.liquidation_document_url && (
            <div><span className="font-medium">Liquidation Document:</span> <a href={request.liquidation_document_url} target="_blank" className="text-blue-500">Download</a></div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Change Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="funded">Funded</SelectItem>
                  <SelectItem value="liquidated">Liquidated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Internal Notes (optional)</label>
              <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add comments or reason for change..." />
            </div>
            <Button onClick={updateStatus} disabled={newStatus === request.status}>Update Status</Button>
          </CardContent>
        </Card>
      )}

      {canApprove && (
        <div className="flex gap-3">
          <Button onClick={async () => {
            await supabase.from('budget_requests').update({ status: 'approved', approved_at: new Date() }).eq('id', params.id);
            fetchData();
          }}>Approve</Button>
          <Button variant="destructive" onClick={async () => {
            await supabase.from('budget_requests').update({ status: 'rejected' }).eq('id', params.id);
            fetchData();
          }}>Reject</Button>
        </div>
      )}
    </div>
  );
}
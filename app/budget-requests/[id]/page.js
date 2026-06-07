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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setRole(profile?.role);

      const { data, error } = await supabase
        .from('budget_requests')
        .select('*')
        .eq('id', params.id)
        .single();
      if (error) throw error;
      setRequest(data);
      setNewStatus(data.status);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load request');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status, notes = '') {
    const updates = { status, updated_at: new Date() };
    if (status === 'approved') updates.approved_at = new Date();
    if (status === 'funded') updates.funded_at = new Date();
    if (notes) updates.review_notes = notes;

    const { error } = await supabase
      .from('budget_requests')
      .update(updates)
      .eq('id', params.id);
    if (error) {
      toast.error('Error updating status');
    } else {
      toast.success(`Request ${status}`);
      fetchData();
    }
  }

  const handleStatusChange = async () => {
    if (newStatus === request.status) return;
    await updateStatus(newStatus, comment);
    setComment('');
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!request) return <div className="p-8">Request not found</div>;

  const isAdmin = role === 'admin';
  const canApprove = isAdmin && (request.status === 'submitted' || request.status === 'under_review');

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeInUp">
      <BackButton fallbackUrl={isAdmin ? '/admin/budget-requests' : '/budget-requests'} />
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">{request.title}</h1>
        <Badge className={statusColors[request.status]}>{request.status.replace('_', ' ')}</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle>Request Details</CardTitle></CardHeader>
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
            <div><span className="font-medium">Liquidation Document:</span> <a href={request.liquidation_document_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Download</a></div>
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
            <Button onClick={handleStatusChange} disabled={newStatus === request.status}>Update Status</Button>
          </CardContent>
        </Card>
      )}

      {canApprove && (
        <div className="flex gap-3">
          <Button onClick={() => updateStatus('approved')}>Approve</Button>
          <Button variant="destructive" onClick={() => updateStatus('rejected')}>Reject</Button>
        </div>
      )}
    </div>
  );
}
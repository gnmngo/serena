'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

const statusColors = {
  draft: 'bg-gray-200 text-gray-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  funded: 'bg-emerald-100 text-emerald-800',
  liquidated: 'bg-purple-100 text-purple-800',
};

export default function MyBudgetRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('budget_requests')
        .select('*')
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false });
      if (!error) setRequests(data || []);
    }
    setLoading(false);
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Budget Requests</h1>
        <Link href="/budget-requests/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Request</Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon="💰"
          title="No budget requests yet"
          description="Submit a funding request for your organization or event."
          action={<Link href="/budget-requests/new"><Button>Create Request</Button></Link>}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{req.title}</CardTitle>
                  <Badge className={statusColors[req.status] || 'bg-gray-100'}>{req.status.replace('_', ' ')}</Badge>
                </div>
                <CardDescription>Requested amount: ₱{req.amount.toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2">{req.description}</p>
                <p className="text-xs text-gray-400 mt-2">Submitted: {new Date(req.created_at).toLocaleDateString()}</p>
              </CardContent>
              <CardFooter>
                <Link href={`/budget-requests/${req.id}`}>
                  <Button variant="outline" size="sm"><Eye className="mr-1 h-4 w-4" /> View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors = {
  submitted: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  funded: 'bg-emerald-100 text-emerald-800',
  liquidated: 'bg-purple-100 text-purple-800',
};

export default function AdminBudgetRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  async function fetchRequests() {
    try {
      let query = supabase.from('budget_requests').select('*').order('created_at', { ascending: false });
      if (filter) {
        query = query.or(`title.ilike.%${filter}%,requester_name.ilike.%${filter}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading budget requests...</div>;

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Budget Requests Management</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by title or name..." value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-9" />
        </div>
      </div>
      <div className="grid gap-4">
        {requests.map((req) => (
          <Link key={req.id} href={`/budget-requests/${req.id}`}>
            <Card className="hover:shadow-md transition cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{req.title}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[req.status] || 'bg-gray-100'}`}>
                    {req.status?.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Requested by: {req.requester_name || req.requester_email || 'Unknown'} | Amount: ₱{req.amount?.toLocaleString()}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2">{req.description}</p>
                <p className="text-xs text-gray-400 mt-2">Submitted: {new Date(req.created_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {requests.length === 0 && (
          <div className="text-center py-8 text-gray-500">No budget requests found.</div>
        )}
      </div>
    </div>
  );
}
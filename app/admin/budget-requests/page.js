'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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
  const [filter, setFilter] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    let query = supabase.from('budget_requests').select('*').order('created_at', { ascending: false });
    if (filter) {
      query = query.or(`title.ilike.%${filter}%,requester_name.ilike.%${filter}%`);
    }
    const { data } = await query;
    setRequests(data || []);
  }

  useEffect(() => {
    fetchRequests();
  }, [filter]);

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
                  <Badge className={statusColors[req.status]}>{req.status.replace('_', ' ')}</Badge>
                </div>
                <CardDescription>Requested by: {req.requester_name} | Amount: ₱{req.amount.toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2">{req.description}</p>
                <p className="text-xs text-gray-400 mt-2">Submitted: {new Date(req.created_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
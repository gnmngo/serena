'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

export default function NewBudgetRequest() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    category: '',
    organization: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) {
      toast.error('Please fill in required fields');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('budget_requests').insert({
      ...form,
      amount: parseFloat(form.amount),
      submitted_by: user.id,
      requester_name: user.email?.split('@')[0],
      requester_email: user.email,
      status: 'submitted',
    });
    if (error) {
      toast.error('Error submitting request');
      console.error(error);
    } else {
      toast.success('Request submitted for review');
      router.push('/budget-requests');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeInUp">
      <h1 className="text-3xl font-bold mb-6">Submit Budget Request</h1>
      <Card>
        <CardHeader><CardTitle>Request Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea rows={4} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount (₱) *</label>
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select onValueChange={(val) => setForm({...form, category: val})}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Events">Events</SelectItem>
                  <SelectItem value="Supplies">Supplies</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Organization/Club (optional)</label>
              <Input value={form.organization} onChange={(e) => setForm({...form, organization: e.target.value})} />
            </div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Submitting...' : 'Submit Request'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
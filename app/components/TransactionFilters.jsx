'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

export default function TransactionFilters({ initialFilters = {} }) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState({
    startDate: initialFilters?.startDate || '',
    endDate: initialFilters?.endDate || '',
    category: initialFilters?.category || 'all',
    search: initialFilters?.search || '',
  });

  useEffect(() => {
    setFilters({
      startDate: initialFilters?.startDate || '',
      endDate: initialFilters?.endDate || '',
      category: initialFilters?.category || 'all',
      search: initialFilters?.search || '',
    });
  }, [initialFilters]);

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyFilters = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.startDate) params.set('startDate', newFilters.startDate);
    if (newFilters.endDate) params.set('endDate', newFilters.endDate);
    if (newFilters.category !== 'all') params.set('category', newFilters.category);
    if (newFilters.search) params.set('search', newFilters.search);
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ''}`);
  };

  const clearFilters = () => {
    const cleared = { startDate: '', endDate: '', category: 'all', search: '' };
    setFilters(cleared);
    router.push(pathname);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
          <Select value={filters.category} onValueChange={(val) => handleChange('category', val)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="allocation">Allocation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
          <Input placeholder="Description..." value={filters.search} onChange={(e) => handleChange('search', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={clearFilters} className="text-red-500">
          <X className="w-4 h-4 mr-1" /> Clear Filters
        </Button>
      </div>
    </div>
  );
}
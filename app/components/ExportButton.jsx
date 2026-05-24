'use client';

import { ExportToCsv } from '@/lib/export';

export default function ExportButton({ data, fileName = 'budget_transactions.csv' }) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }
    const csv = ExportToCsv(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleExport} className="btn-secondary">
      Export CSV
    </button>
  );
}
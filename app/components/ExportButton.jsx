'use client';

import { ExportToCsv } from '@/lib/export';

export default function ExportButton({ data, fileName = 'budget_transactions.csv' }) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }
    ExportToCsv(data, fileName);
  };

  return (
    <button onClick={handleExport} className="btn-secondary">
      📥 Export CSV
    </button>
  );
}
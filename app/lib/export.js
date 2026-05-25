export function ExportToCsv(data, filename = 'budget_transactions.csv') {
  if (!data || data.length === 0) return '';

  // Define the desired column order
  const columns = ['transaction_date', 'description', 'amount', 'category'];
  const headers = ['Date', 'Description', 'Amount', 'Category'];

  // Create CSV rows
  const rows = data.map(row => {
    const date = new Date(row.transaction_date).toLocaleDateString();
    const amount = parseFloat(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return [date, row.description, amount, row.category].map(cell => `"${cell}"`).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
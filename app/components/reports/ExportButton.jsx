'use client';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ExportToCsv } from '@/lib/export';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function ExportButton({ data, fileName = 'export', summary = null }) {
  const handleCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }
    ExportToCsv(data, `${fileName}.csv`);
  };

  const handlePDF = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    doc.setTextColor(52, 52, 52);
    doc.text('SERENA Export', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });

    if (summary) {
      let y = 40;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Income: ₱${summary.totalIncome?.toLocaleString() || 0}`, 14, y);
      y += 6;
      doc.text(`Total Expenses: ₱${summary.totalExpenses?.toLocaleString() || 0}`, 14, y);
      y += 6;
      doc.text(`Remaining Balance: ₱${summary.balance?.toLocaleString() || 0}`, 14, y);
      y += 12;
      autoTable(doc, { startY: y, head: [Object.keys(data[0])], body: data.map(row => Object.values(row)) });
    } else {
      autoTable(doc, { head: [Object.keys(data[0])], body: data.map(row => Object.values(row)) });
    }
    doc.save(`${fileName}.pdf`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePDF}>
          <FileText className="w-4 h-4 mr-2" /> PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
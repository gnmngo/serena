'use client';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function PDFReport({ transactions, summary, fileName = 'financial_report.pdf' }) {
  const generatePDF = () => {
    if (!transactions || transactions.length === 0) {
      toast.error('No data to generate PDF');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(52, 52, 52); // #343434
    doc.text('SERENA Financial Report', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });

    // Summary section
    let y = 40;
    doc.setFontSize(12);
    doc.setTextColor(52, 52, 52);
    doc.text('Executive Summary', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Income: ₱${summary.totalIncome?.toLocaleString() || 0}`, 14, y);
    y += 6;
    doc.text(`Total Expenses: ₱${summary.totalExpenses?.toLocaleString() || 0}`, 14, y);
    y += 6;
    doc.text(`Remaining Balance: ₱${summary.balance?.toLocaleString() || 0}`, 14, y);
    y += 6;
    doc.text(`Budget Utilization: ${summary.budgetUtilization?.toFixed(1) || 0}%`, 14, y);
    y += 12;

    // Transactions table
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Description', 'Amount', 'Category']],
      body: transactions.map(tx => [
        new Date(tx.transaction_date).toLocaleDateString(),
        tx.description,
        `₱${Math.abs(tx.amount).toLocaleString()}`,
        tx.category,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [52, 52, 52], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 70 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30 },
      },
    });

    doc.save(fileName);
  };

  return (
    <Button onClick={generatePDF} variant="outline" className="gap-2">
      <FileText className="w-4 h-4" /> PDF Report
    </Button>
  );
}
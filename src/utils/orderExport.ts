import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { getFullUnitName, UnitAbbreviation } from '@/types';

interface OrderItem {
  product: {
    name: string;
    unit: UnitAbbreviation;
  };
  quantity: number;
}

interface Order {
  supplier: {
    name: string;
  };
  items?: OrderItem[];
}

export function exportOrderToPDF(order: Order): void {
  const doc = new jsPDF();
  const date = format(new Date(), 'd MMMM yyyy, HH:mm', { locale: el });
  
  // Title
  doc.setFontSize(18);
  doc.text(`Παραγγελία - ${order.supplier.name}`, 14, 20);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Ημερομηνία: ${date}`, 14, 30);
  
  // Table
  const tableData = order.items?.map(item => [
    item.product.name,
    item.quantity.toString(),
    getFullUnitName(item.product.unit, item.quantity)
  ]) || [];

  autoTable(doc, {
    startY: 40,
    head: [['Προϊόν', 'Ποσότητα', 'Μονάδα']],
    body: tableData,
    styles: {
      font: 'helvetica',
      fontSize: 10,
    },
    headStyles: {
      fillColor: [30, 58, 95], // primary color
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 40 },
    },
  });

  // Save
  const fileName = `Παραγγελία_${order.supplier.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}

export function exportOrderToExcel(order: Order): void {
  const date = format(new Date(), 'd MMMM yyyy, HH:mm', { locale: el });
  
  // Create worksheet data
  const wsData = [
    ['Παραγγελία - ' + order.supplier.name],
    ['Ημερομηνία: ' + date],
    [],
    ['Προϊόν', 'Ποσότητα', 'Μονάδα'],
    ...(order.items?.map(item => [
      item.product.name,
      item.quantity,
      getFullUnitName(item.product.unit, item.quantity)
    ]) || [])
  ];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 40 }, // Product name
    { wch: 12 }, // Quantity
    { wch: 15 }, // Unit
  ];

  // Merge title cells
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Παραγγελία');

  // Save
  const fileName = `Παραγγελία_${order.supplier.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

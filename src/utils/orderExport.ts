import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
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
  unit?: UnitAbbreviation;
}

interface Order {
  supplier: {
    name: string;
  };
  items?: OrderItem[];
}

// Create a hidden element for PDF generation with Greek support
function createPDFElement(order: Order): HTMLDivElement {
  const date = format(new Date(), 'd MMMM yyyy, HH:mm', { locale: el });
  
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 800px;
    padding: 40px;
    background: white;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  `;
  
  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: bold; color: #1e3a5f; margin: 0 0 8px 0;">
        Παραγγελία - ${order.supplier.name}
      </h1>
      <p style="font-size: 14px; color: #666; margin: 0;">
        Ημερομηνία: ${date}
      </p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr style="background: #1e3a5f; color: white;">
          <th style="padding: 12px 16px; text-align: left; font-weight: 600;">Προϊόν</th>
          <th style="padding: 12px 16px; text-align: right; font-weight: 600; width: 100px;">Ποσότητα</th>
          <th style="padding: 12px 16px; text-align: left; font-weight: 600; width: 120px;">Μονάδα</th>
        </tr>
      </thead>
      <tbody>
        ${order.items?.map((item, index) => {
          const displayUnit = item.unit || item.product.unit;
          return `
          <tr style="background: ${index % 2 === 0 ? '#f8f9fa' : 'white'}; border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 16px;">${item.product.name}</td>
            <td style="padding: 12px 16px; text-align: right; font-weight: 500;">${item.quantity}</td>
            <td style="padding: 12px 16px;">${getFullUnitName(displayUnit, item.quantity)}</td>
          </tr>
        `;}).join('') || ''}
      </tbody>
    </table>
    
    <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #e5e7eb;">
      <p style="font-size: 12px; color: #888; text-align: right; margin: 0;">
        Σύνολο ειδών: ${order.items?.length || 0}
      </p>
    </div>
  `;
  
  return container;
}

export async function exportOrderToPDF(order: Order): Promise<void> {
  // Create the element for rendering
  const element = createPDFElement(order);
  document.body.appendChild(element);
  
  try {
    // Use html2canvas to capture the element with proper Greek support
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate dimensions to fit the page
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add image to PDF
    let heightLeft = imgHeight;
    let position = margin;
    
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - margin * 2);
    
    // Handle multi-page if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);
    }
    
    // Save
    const fileName = `Παραγγελία_${order.supplier.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdf.save(fileName);
  } finally {
    // Clean up
    document.body.removeChild(element);
  }
}

export function exportOrderToExcel(order: Order): void {
  const date = format(new Date(), 'd MMMM yyyy, HH:mm', { locale: el });
  
  // Create worksheet data with proper structure
  const wsData = [
    ['Παραγγελία - ' + order.supplier.name],
    ['Ημερομηνία: ' + date],
    [],
    ['Προϊόν', 'Ποσότητα', 'Μονάδα'],
    ...(order.items?.map(item => {
      const displayUnit = item.unit || item.product.unit;
      return [
        item.product.name,
        item.quantity,
        getFullUnitName(displayUnit, item.quantity)
      ];
    }) || []),
    [],
    ['Σύνολο ειδών:', order.items?.length || 0, '']
  ];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-fit column widths based on content
  const colWidths = [
    { wch: Math.max(...(order.items?.map(i => i.product.name.length) || [20]), 25) },
    { wch: 15 },
    { wch: 15 },
  ];
  ws['!cols'] = colWidths;

  // Merge title and date cells
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
  ];

  // Add some basic styling information (limited in xlsx)
  // Set row heights for header
  ws['!rows'] = [
    { hpt: 24 }, // Title
    { hpt: 18 }, // Date
    { hpt: 12 }, // Empty
    { hpt: 20 }, // Headers
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Παραγγελία');

  // Save
  const fileName = `Παραγγελία_${order.supplier.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// Offline export functions (work without network)
export function canExportOffline(): boolean {
  return true; // PDF and Excel generation is fully client-side
}

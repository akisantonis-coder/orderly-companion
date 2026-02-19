import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { getFullUnitName, UnitAbbreviation } from '@/types';
import type { AppSettings } from '@/hooks/useSettings';

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

// Load settings from localStorage
function getSettings(): AppSettings {
  const SETTINGS_KEY = 'app_settings';
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing settings:', e);
    }
  }
  return {
    company: {
      name: '',
      address: '',
      phone: '',
      email: '',
      taxId: '',
      website: '',
    },
    defaultOrderText: '',
  };
}

// Generate order text from template
export function generateOrderText(order: Order, customText?: string): string {
  const settings = getSettings();
  const date = format(new Date(), 'd MMMM yyyy, HH:mm', { locale: el });
  
  // Use custom text if provided, otherwise use default template
  let text = customText !== undefined ? customText : (settings.defaultOrderText || '');
  
  // If text is still empty, use fallback template
  if (!text.trim()) {
    text = `Γεια σας,

Θα θέλαμε να παραγγείλουμε τα παρακάτω είδη:

[ΕΙΔΗ]

Παρακαλούμε επιβεβαιώστε την παραλαβή και ενημερώστε μας για τυχόν ελλείψεις.

Ευχαριστούμε,
[ΕΤΑΙΡΙΑ]`;
  }
  
  // Generate items list
  const itemsList = order.items?.map((item) => {
    const displayUnit = item.unit || item.product.unit;
    return `• ${item.product.name}: ${item.quantity} ${getFullUnitName(displayUnit, item.quantity)}`;
  }).join('\n') || '';
  
  // Replace placeholders
  text = text.replace(/\[ΕΙΔΗ\]/g, itemsList);
  text = text.replace(/\[ΕΤΑΙΡΙΑ\]/g, settings.company.name || 'Εταιρία');
  
  return text;
}

// Create a hidden element for PDF generation with Greek support
function createPDFElement(order: Order, customText?: string): HTMLDivElement {
  const settings = getSettings();
  const date = format(new Date(), 'd MMMM yyyy, HH:mm', { locale: el });
  const orderText = generateOrderText(order, customText);
  
  // Format order text with line breaks
  const formattedText = orderText.split('\n').map(line => 
    line.trim() ? `<p style="margin: 8px 0; line-height: 1.6;">${line.replace(/•/g, '&bull;')}</p>` : '<p style="margin: 4px 0;"></p>'
  ).join('');
  
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
  
  // Company header section
  const companyHeader = settings.company.name ? `
    <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb;">
      <h2 style="font-size: 20px; font-weight: bold; color: #1e3a5f; margin: 0 0 8px 0;">
        ${settings.company.name}
      </h2>
      ${settings.company.address ? `<p style="font-size: 12px; color: #666; margin: 2px 0;">${settings.company.address}</p>` : ''}
      ${settings.company.phone ? `<p style="font-size: 12px; color: #666; margin: 2px 0;">Τηλ: ${settings.company.phone}</p>` : ''}
      ${settings.company.email ? `<p style="font-size: 12px; color: #666; margin: 2px 0;">Email: ${settings.company.email}</p>` : ''}
      ${settings.company.taxId ? `<p style="font-size: 12px; color: #666; margin: 2px 0;">ΑΦΜ: ${settings.company.taxId}</p>` : ''}
    </div>
  ` : '';
  
  container.innerHTML = `
    ${companyHeader}
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: bold; color: #1e3a5f; margin: 0 0 8px 0;">
        Παραγγελία - ${order.supplier.name}
      </h1>
      <p style="font-size: 14px; color: #666; margin: 0;">
        Ημερομηνία: ${date}
      </p>
    </div>
    
    <div style="margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #333;">
      ${formattedText}
    </div>
    
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr style="background: #1e3a5f; color: white;">
          <th style="padding: 12px 16px; text-align: left; font-weight: 600;">Είδος</th>
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

export async function exportOrderToPDF(order: Order, customText?: string): Promise<void> {
  // Create the element for rendering
  const element = createPDFElement(order, customText);
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

export function exportOrderToExcel(order: Order, customText?: string): void {
  const settings = getSettings();
  const date = format(new Date(), 'd MMMM yyyy, HH:mm', { locale: el });
  const orderText = generateOrderText(order, customText);
  
  // Create worksheet data with proper structure
  const wsData: any[] = [];
  
  // Add company info if available
  if (settings.company.name) {
    wsData.push([settings.company.name]);
    if (settings.company.address) wsData.push([settings.company.address]);
    if (settings.company.phone) wsData.push(['Τηλ: ' + settings.company.phone]);
    if (settings.company.email) wsData.push(['Email: ' + settings.company.email]);
    if (settings.company.taxId) wsData.push(['ΑΦΜ: ' + settings.company.taxId]);
    wsData.push([]);
  }
  
  wsData.push(
    ['Παραγγελία - ' + order.supplier.name],
    ['Ημερομηνία: ' + date],
    [],
    ...orderText.split('\n').filter(line => line.trim()).map(line => [line]),
    [],
    ['Είδος', 'Ποσότητα', 'Μονάδα'],
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

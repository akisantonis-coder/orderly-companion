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

// Load settings from Dexie Database
async function getSettings(): Promise<AppSettings> {
  try {
    const db = (await import('@/lib/db')).db;
    const settings = await db.settings.get('app');
    
    if (settings) {
      return {
        company: {
          name: '',
          address: '',
          phone: '',
          email: '',
          taxId: '',
          website: '',
        },
        pdfIntroduction: settings.pdfIntroduction || '',
        pdfFooter: settings.pdfFooter || '',
      };
    }
  } catch (e) {
    console.error('Error loading settings from Dexie:', e);
  }
  
  // Fallback to localStorage for backward compatibility
  const SETTINGS_KEY = 'app_settings';
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing localStorage settings:', e);
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
    pdfIntroduction: '',
    pdfFooter: '',
  };
}

// Generate order text from template
export async function generateOrderText(order: Order, customText?: string): Promise<string> {
  const settings = await getSettings();
  const date = format(new Date(), 'd MMMM yyyy, HH:mm', { locale: el });
  
  // Use custom text if provided, otherwise use pdfIntroduction
  let text = customText !== undefined ? customText : settings.pdfIntroduction;
  
  // If text is still empty, use simple fallback
  if (!text.trim()) {
    text = `Γεια σας,

Θα θέλαμε να παραγγείλουμε τα παρακάτω είδη:

[ΕΙΔΗ]

Παρακαλούμε επιβεβαιώστε την παραλαβή.

Ευχαριστούμε,
${settings.company.name || 'Εταιρία'}`;
  }
  
  // Generate items list
  const itemsList = order.items?.map((item) => {
    const displayUnit = item.unit || item.product?.unit;
    return `• ${item.product?.name || 'Άγνωστο Προϊόν'}: ${item.quantity} ${getFullUnitName(displayUnit, item.quantity)}`;
  }).join('\n') || '';
  
  // Replace placeholders
  text = text.replace(/\[ΕΙΔΗ\]/g, itemsList);
  
  return text;
}

// Create a hidden element for PDF generation with Greek support
async function createPDFElement(order: Order, customText?: string): Promise<HTMLDivElement> {
  console.log('Order data in PDF element:', order);
  
  const settings = await getSettings();
  console.log('PDF settings in createPDFElement:', settings);
  
  // Load company data from correct localStorage key
  const companyData = JSON.parse(localStorage.getItem('orderly_company_settings') || '{}');
  console.log('Company data from localStorage in PDF:', companyData);
  
  // Use fallback if no company data found
  const companyInfo = companyData.name ? companyData : {
    name: 'Παρακαλώ συμπληρώστε τα στοιχεία εταιρείας στις Ρυθμίσεις',
    address: '',
    phone: '',
    email: '',
    taxId: '',
    website: ''
  };
  
  const date = format(new Date(), 'd MMMM yyyy, HH:mm', { locale: el });
  const orderText = await generateOrderText(order, customText);
  
  // Format order text with line breaks
  const formattedText = orderText.split('\n').map(line => 
    line.trim() ? `<p style="margin: 8px 0; line-height: 1.6;">${line.replace(/•/g, '&bull;')}</p>` : '<p style="margin: 4px 0;"></p>'
  ).join('');
  
  // Format PDF Introduction if exists
  const formattedIntro = settings.pdfIntroduction ? settings.pdfIntroduction.split('\n').map(line => 
    line.trim() ? `<p style="margin: 8px 0; line-height: 1.6; font-style: italic;">${line.replace(/•/g, '&bull;')}</p>` : '<p style="margin: 4px 0;"></p>'
  ).join('') : '';
  
  // Format PDF Footer if exists
  const formattedFooter = settings.pdfFooter ? settings.pdfFooter.split('\n').map(line => 
    line.trim() ? `<p style="margin: 8px 0; line-height: 1.6; font-size: 12px; color: #666;">${line.replace(/•/g, '&bull;')}</p>` : '<p style="margin: 4px 0;"></p>'
  ).join('') : '';
  
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
  
  // Company header section - use localStorage data with fallback
  const companyHeader = companyInfo.name ? `
    <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb;">
      <h2 style="font-size: 16px; font-weight: bold; color: #1e3a5f; margin: 0 0 8px 0;">
        ${companyInfo.name}
      </h2>
      ${companyInfo.address ? `<p style="font-size: 12px; color: #666; margin: 2px 0;">${companyInfo.address}</p>` : ''}
      ${companyInfo.phone ? `<p style="font-size: 12px; color: #666; margin: 2px 0;">Τηλ: ${companyInfo.phone}</p>` : ''}
      ${companyInfo.email ? `<p style="font-size: 12px; color: #666; margin: 2px 0;">Email: ${companyInfo.email}</p>` : ''}
      ${companyInfo.taxId ? `<p style="font-size: 12px; color: #666; margin: 2px 0;">ΑΦΜ: ${companyInfo.taxId}</p>` : ''}
    </div>
  ` : '';
  
  container.innerHTML = `
    ${companyHeader}
    <div style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb;">
        <div style="flex: 1;">
          <h1 style="font-size: 20px; font-weight: bold; color: #1e3a5f; margin: 0 0 8px 0;">
            Παραγγελία: ${companyInfo.name || 'Άγνωστη Εταιρεία'}
          </h1>
          <p style="font-size: 14px; color: #666; margin: 0;">
            Προς: ${order?.supplier?.name || 'Άγνωστος Προμηθευτής'}
          </p>
          <p style="font-size: 14px; color: #666; margin: 4px 0 0 0;">
            Ημερομηνία: ${date}
          </p>
        </div>
        <div style="text-align: right; font-size: 12px; color: #666;">
          <div>${format(new Date(), 'd MMMM yyyy', { locale: el })}</div>
        </div>
      </div>
    </div>
    
    ${formattedIntro ? `
    <div style="margin-bottom: 24px; padding: 16px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
      ${formattedIntro}
    </div>
    ` : ''}
    
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; border: 1px solid #e5e7eb;">
      <thead>
        <tr style="background: #1e3a5f; color: white;">
          <th style="padding: 12px 16px; text-align: left; font-weight: 600; border: 1px solid #e5e7eb;">Είδος</th>
          <th style="padding: 12px 16px; text-align: right; font-weight: 600; width: 100px; border: 1px solid #e5e7eb;">Ποσότητα</th>
          <th style="padding: 12px 16px; text-align: left; font-weight: 600; width: 120px; border: 1px solid #e5e7eb;">Μονάδα</th>
        </tr>
      </thead>
      <tbody>
        ${order.items?.map((item, index) => {
          const displayUnit = item.unit || item.product?.unit;
          return `
          <tr style="background: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
            <td style="padding: 12px 16px; border: 1px solid #e5e7eb;">${item.product?.name || 'Άγνωστο Προϊόν'}</td>
            <td style="padding: 12px 16px; text-align: right; font-weight: 500; border: 1px solid #e5e7eb;">${item.quantity}</td>
            <td style="padding: 12px 16px; border: 1px solid #e5e7eb;">${getFullUnitName(displayUnit, item.quantity)}</td>
          </tr>
        `;}).join('') || ''}
      </tbody>
    </table>
    
    <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #e5e7eb;">
      <p style="font-size: 12px; color: #888; text-align: right; margin: 0;">
        Σύνολο ειδών: ${order.items?.length || 0}
      </p>
    </div>
    
    ${formattedFooter ? `
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      ${formattedFooter}
    </div>
    ` : ''}
  `;
  
  return container;
}

export async function exportOrderToPDF(order: Order, customText?: string): Promise<void> {
  // Create the element for rendering
  const element = await createPDFElement(order, customText);
  document.body.appendChild(element);
  
  try {
    // Wait for DOM to render the element
    await new Promise(resolve => setTimeout(resolve, 100));
    
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
    const fileName = `Παραγγελία_${order?.supplier?.name?.replace(/\s+/g, '_') || 'Unknown'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdf.save(fileName);
  } finally {
    // Clean up
    document.body.removeChild(element);
  }
}

export async function exportOrderToExcel(order: Order, customText?: string): Promise<void> {
  const settings = await getSettings();
  const date = format(new Date(), 'd MMMM yyyy, HH:mm', { locale: el });
  const orderText = await generateOrderText(order, customText);
  
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
    ['Παραγγελία - ' + (order?.supplier?.name || 'Άγνωστος Προμηθευτής')],
    ['Ημερομηνία: ' + date],
    [],
    ...orderText.split('\n').filter(line => line.trim()).map(line => [line]),
    [],
    ['Είδος', 'Ποσότητα', 'Μονάδα'],
    ...(order.items?.map(item => {
      const displayUnit = item.unit || item.product?.unit;
      return [
        item.product?.name || 'Άγνωστο Προϊόν',
        item.quantity,
        getFullUnitName(displayUnit, item.quantity)
      ];
    }) || []),
    [],
    ['Σύνολο ειδών:', order.items?.length || 0, '']
  );

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

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Send, Loader2, Building2, Calendar } from 'lucide-react';
import { db } from '../lib/db';
import { exportOrderToPDF } from '../utils/orderExport';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { getFullUnitName, UnitAbbreviation } from '@/types';

export default function OrderPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfSettings, setPdfSettings] = useState({ pdfIntroduction: '', pdfFooter: '' });
  const [companySettings, setCompanySettings] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    taxId: '',
    website: ''
  });

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;
      
      try {
        // Load order data
        const orderData = await db.orders.get(id);
        
        if (!orderData) {
          console.error('Order not found');
          setLoading(false);
          return;
        }
        
        console.log('Raw order data:', orderData);
        
        // Load supplier data if supplier_id exists
        let supplierData = null;
        if (orderData.supplier_id) {
          supplierData = await db.suppliers.get(orderData.supplier_id);
          console.log('Supplier data:', supplierData);
        }
        
        // Load order items
        const itemsData = await db.orderItems.where('order_id').equals(id).toArray();
        console.log('Order items data:', itemsData);
        
        // Load products for each item
        const itemsWithProducts = await Promise.all(
          itemsData.map(async (item) => {
            const productData = await db.products.get(item.product_id);
            console.log(`Product data for item ${item.id}:`, productData);
            
            return {
              ...item,
              product: productData || { name: 'Άγνωστο Προϊόν' }
            };
          })
        );
        
        console.log('Items with products:', itemsWithProducts);
        
        // Merge all data
        const fullOrder = {
          ...orderData,
          supplier: supplierData || { name: 'Άγνωστος Προμηθευτής' },
          items: itemsWithProducts
        };
        
        console.log('Full order with supplier and items:', fullOrder);
        setOrder(fullOrder);
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrder();
  }, [id]);

  // Load PDF and Company settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await db.settings.get('app');
        if (settings) {
          setPdfSettings({
            pdfIntroduction: settings.pdfIntroduction || '',
            pdfFooter: settings.pdfFooter || ''
          });
          
          // Load company settings from correct localStorage key
          const companyData = localStorage.getItem('orderly_company_settings');
          console.log('Company data from localStorage in OrderPreview:', companyData);
          
          if (companyData) {
            const parsed = JSON.parse(companyData);
            setCompanySettings({
              name: parsed.name || '',
              address: parsed.address || '',
              phone: parsed.phone || '',
              email: parsed.email || '',
              taxId: parsed.taxId || '',
              website: parsed.website || ''
            });
          } else {
            console.log('Company settings not found in localStorage');
            setCompanySettings({
              name: 'Παρακαλώ συμπληρώστε τα στοιχεία εταιρείας στις Ρυθμίσεις',
              address: '',
              phone: '',
              email: '',
              taxId: '',
              website: ''
            });
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  const handleExportPDF = async () => {
    if (!order) {
      console.error('No order data available');
      toast.error('Δεν υπάρχουν δεδομένα παραγγελίας');
      return;
    }
    
    console.log('Order data in OrderPreview:', order);
    
    try {
      await exportOrderToPDF(order, order.custom_text);
      toast.success('Το PDF δημιουργήθηκε!');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Αποτυχία δημιουργίας PDF');
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Πίσω
      </button>

      {/* Export Button */}
      <div className="mb-6">
        <button 
          onClick={handleExportPDF}
          className="w-full flex items-center justify-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <FileText className="w-5 h-5 mr-2" /> Εξαγωγή σε PDF
        </button>
      </div>

      {/* Visual Preview - A4 Paper Style */}
      <div className="bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden">
        {/* Paper Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Προεπισκόπηση Παραγγελίας</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              {format(new Date(), 'd MMMM yyyy, HH:mm', { locale: el })}
            </div>
          </div>
        </div>

        {/* Paper Content */}
        <div className="p-8">
          {/* Company Header */}
          {companySettings.name && (
            <div className="mb-8 pb-6 border-b-2 border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {companySettings.name}
                  </h2>
                  <div className="text-sm text-gray-600 space-y-1">
                    {companySettings.address && (
                      <div>{companySettings.address}</div>
                    )}
                    <div className="flex flex-wrap gap-4">
                      {companySettings.phone && (
                        <div>Τηλ: {companySettings.phone}</div>
                      )}
                      {companySettings.taxId && (
                        <div>ΑΦΜ: {companySettings.taxId}</div>
                      )}
                    </div>
                    {companySettings.email && (
                      <div>Email: {companySettings.email}</div>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div>{format(new Date(), 'd MMMM yyyy', { locale: el })}</div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div>{format(new Date(), 'd MMMM yyyy', { locale: el })}</div>
              </div>
            </div>
          </div>
          )}

          {/* Supplier Info */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Παραγγελία: {companySettings.name || 'Άγνωστη Εταιρεία'}
              </h2>
            </div>
            <div className="text-sm text-gray-600">
              Προς: {order?.supplier?.name || 'Άγνωστος Προμηθευτής'}
            </div>
          </div>

          {/* PDF Introduction */}
          {pdfSettings.pdfIntroduction && (
            <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
              <div className="text-gray-700 whitespace-pre-wrap font-medium">
                {pdfSettings.pdfIntroduction}
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Είδη Παραγγελίας</h3>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">
                      Είδος
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 border-r border-gray-300 w-32">
                      Ποσότητα
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-32">
                      Μονάδα
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order?.items?.map((item, index) => {
                    const displayUnit = item.unit || item.product?.unit;
                    return (
                      <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          {item.product?.name || 'Άγνωστο Προϊόν'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium border-r border-gray-200">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {getFullUnitName(displayUnit, item.quantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Items Summary */}
            <div className="mt-4 text-right">
              <span className="text-sm text-gray-600">
                Σύνολο ειδών: <span className="font-semibold text-gray-800">{order?.items?.length || 0}</span>
              </span>
            </div>
          </div>

          {/* PDF Footer */}
          {pdfSettings.pdfFooter && (
            <div className="mt-8 pt-6 border-t border-gray-300">
              <div className="text-sm text-gray-600 whitespace-pre-wrap">
                {pdfSettings.pdfFooter}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Send, Loader2 } from 'lucide-react';
import { db } from '../lib/db';
import { exportOrderToPDF } from '../lib/pdf';
import { toast } from 'react-hot-toast';

export default function OrderPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;
      const data = await db.orders.get(id);
      setOrder(data);
      setLoading(false);
    };
    loadOrder();
  }, [id]);

  const handleExportPDF = () => {
    if (!order) return;
    
    // Φέρνουμε τις ρυθμίσεις από το localStorage
    const stored = localStorage.getItem('app_settings');
    const settings = stored ? JSON.parse(stored) : {};
    
    // Ένωση κειμένων: Intro + Κύριο κείμενο + Footer
    const intro = settings.pdfIntro ? `${settings.pdfIntro}\n\n` : '';
    const footer = settings.pdfFooter ? `\n\n${settings.pdfFooter}` : '';
    const mainContent = order.custom_text || settings.defaultOrderText || '';
    
    const finalContent = `${intro}${mainContent}${footer}`;

    exportOrderToPDF(order, finalContent);
    toast.success('Το PDF δημιουργήθηκε!');
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Πίσω
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Προεπισκόπηση Παραγγελίας</h1>
        <div className="space-y-4">
          <button 
            onClick={handleExportPDF}
            className="w-full flex items-center justify-center bg-blue-600 text-white py-3 rounded-lg font-semibold"
          >
            <FileText className="w-5 h-5 mr-2" /> Εξαγωγή σε PDF
          </button>
        </div>
      </div>
    </div>
  );
}
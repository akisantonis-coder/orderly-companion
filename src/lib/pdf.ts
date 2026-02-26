import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportOrderToPDF = (order: any, finalContent: string) => {
  const doc = new jsPDF();

  // Προσθήκη του κειμένου (Intro + Main Content + Footer)
  doc.setFontSize(12);
  const splitText = doc.splitTextToSize(finalContent, 180);
  doc.text(splitText, 15, 20);

  // Αν θέλεις να προσθέσεις και τον πίνακα με τα προϊόντα αυτόματα:
  // (Εδώ μπορείς να προσθέσεις autoTable αν έχεις τα items)

  doc.save(`order-${order.id}.pdf`);
};
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';

export const generateInvoicePDF = (invoice, settings = {}) => {
  const doc = new jsPDF();
  const business = settings.business || {
    name: 'StockPulse Inventory Systems Ltd.',
    address: 'Plot 42, Tech Park Avenue, Electronic City, Bangalore, India',
    phone: '+91 98765 43210',
    email: 'contact@stockpulse.local',
    gstNumber: '29ABCDE1234F1Z5',
  };

  // Header Banner
  doc.setFillColor(79, 70, 229); // Brand Indigo
  doc.rect(0, 0, 210, 36, 'F');

  // Business Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(business.name, 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${business.address} | GST: ${business.gstNumber}`, 14, 26);
  doc.text(`Phone: ${business.phone} | Email: ${business.email}`, 14, 31);

  // Invoice Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 160, 22);

  // Details Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);

  // Left: Bill To
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO:', 14, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customer?.name || 'Walk-in Customer', 14, 55);
  if (invoice.customer?.phone) doc.text(`Phone: ${invoice.customer.phone}`, 14, 61);
  if (invoice.customer?.address) doc.text(`Address: ${invoice.customer.address}`, 14, 67);
  if (invoice.customer?.gstNumber) doc.text(`GST: ${invoice.customer.gstNumber}`, 14, 73);

  // Right: Invoice Meta
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice No:`, 130, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber, 165, 48);

  doc.setFont('helvetica', 'bold');
  doc.text(`Date:`, 130, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.createdAt), 165, 55);

  doc.setFont('helvetica', 'bold');
  doc.text(`Payment Status:`, 130, 62);
  doc.setFont('helvetica', 'normal');
  doc.text((invoice.paymentStatus || 'PAID').toUpperCase(), 165, 62);

  doc.setFont('helvetica', 'bold');
  doc.text(`Payment Mode:`, 130, 69);
  doc.setFont('helvetica', 'normal');
  doc.text((invoice.paymentMethod || 'CASH').toUpperCase(), 165, 69);

  // Items Table
  const tableRows = (invoice.items || []).map((item, idx) => [
    idx + 1,
    item.name || item.productName,
    item.sku || '-',
    item.quantity,
    formatCurrency(item.unitPrice),
    `${item.discount || 0}%`,
    `${item.taxRate || 0}%`,
    formatCurrency(item.subtotal),
  ]);

  autoTable(doc, {
    startY: 82,
    head: [['#', 'Item Description', 'SKU', 'Qty', 'Unit Price', 'Disc.', 'Tax', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 25, halign: 'right' },
    },
  });

  const finalY = doc.lastAutoTable.finalY || 130;

  // Totals Section
  const rightX = 140;
  const valueX = 195;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', rightX, finalY + 10);
  doc.text(formatCurrency(invoice.subtotal), valueX, finalY + 10, { align: 'right' });

  if (invoice.discountTotal > 0) {
    doc.text('Discount Total:', rightX, finalY + 16);
    doc.text(`-${formatCurrency(invoice.discountTotal)}`, valueX, finalY + 16, { align: 'right' });
  }

  doc.text('Tax / GST Total:', rightX, finalY + 22);
  doc.text(formatCurrency(invoice.taxTotal), valueX, finalY + 22, { align: 'right' });

  doc.setFillColor(241, 245, 249);
  doc.rect(rightX - 4, finalY + 26, 60, 10, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', rightX, finalY + 33);
  doc.text(formatCurrency(invoice.grandTotal), valueX, finalY + 33, { align: 'right' });

  // Terms and Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions:', 14, finalY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text('1. Goods once sold will not be returned unless defective on delivery.', 14, finalY + 26);
  doc.text('2. Payments are subject to our standard commercial credit terms.', 14, finalY + 31);
  doc.text(settings.invoice?.footerText || 'Thank you for choosing StockPulse!', 14, finalY + 45);

  doc.save(`${invoice.invoiceNumber || 'Invoice'}.pdf`);
};

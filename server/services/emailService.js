const nodemailer = require('nodemailer');

// Setup Nodemailer transporter
let transporter = null;

try {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: Number(process.env.EMAIL_PORT) || 2525,
    auth: {
      user: process.env.EMAIL_USER || 'demo_user',
      pass: process.env.EMAIL_PASS || 'demo_pass',
    },
  });
} catch (e) {
  console.log('Nodemailer setup note: Mail transporter will log to console in development mode.');
}

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    if (!to) return { success: false, message: 'No recipient specified' };

    console.log(`[Email Service] Simulating sending email to: ${to} | Subject: "${subject}"`);

    if (transporter && process.env.EMAIL_USER && process.env.EMAIL_USER !== 'demo_user') {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"StockPulse Inventory" <no-reply@stockpulse.local>',
        to,
        subject,
        html,
        attachments,
      });
      return { success: true, messageId: info.messageId };
    } else {
      // In development mode, log that email simulation succeeded
      return {
        success: true,
        simulated: true,
        message: `Email "${subject}" dispatched to ${to} (dev simulation).`,
      };
    }
  } catch (error) {
    console.error('[Email Service Error]', error.message);
    return { success: false, error: error.message };
  }
};

const sendInvoiceEmail = async (customerEmail, invoiceData) => {
  const subject = `Invoice ${invoiceData.invoiceNumber} from StockPulse`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #4f46e5;">StockPulse Inventory Systems</h2>
      <p>Dear Customer,</p>
      <p>Thank you for your purchase. Here is the summary of your invoice <strong>${invoiceData.invoiceNumber}</strong>:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: right;">Qty</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(invoiceData.items || [])
            .map(
              (i) => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px;">${i.name || i.productName}</td>
              <td style="padding: 8px; text-align: right;">${i.quantity}</td>
              <td style="padding: 8px; text-align: right;">₹${i.subtotal}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <div style="text-align: right; font-size: 16px; font-weight: bold; margin-top: 10px;">
        Grand Total: ₹${invoiceData.grandTotal}
      </div>
      <p style="margin-top: 30px; font-size: 12px; color: #64748b;">If you have any questions, contact us at contact@stockpulse.local.</p>
    </div>
  `;
  return await sendEmail({ to: customerEmail, subject, html });
};

const sendLowStockAlertEmail = async (adminEmail, lowStockProducts) => {
  const subject = `⚠️ Low Stock Warning: ${lowStockProducts.length} Product(s) Require Reorder`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ef4444;">StockPulse Critical Inventory Alert</h2>
      <p>The following items have dropped below their minimum stock safety threshold:</p>
      <ul>
        ${lowStockProducts
          .map(
            (p) => `
          <li><strong>${p.name}</strong> (SKU: ${p.sku}) - Current Stock: <span style="color: #dc2626; font-weight: bold;">${p.currentStock}</span> (Min: ${p.minStock})</li>
        `
          )
          .join('')}
      </ul>
      <p>Please review and initiate vendor purchase orders promptly.</p>
    </div>
  `;
  return await sendEmail({ to: adminEmail, subject, html });
};

module.exports = {
  sendEmail,
  sendInvoiceEmail,
  sendLowStockAlertEmail,
};

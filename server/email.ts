import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const OWNER_EMAIL = process.env.OWNER_EMAIL || '';

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customNotes?: string;
};

type OrderData = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  specialInstructions: string | null;
  items: OrderItem[];
  total: number;
};

export async function sendOrderNotification(order: OrderData): Promise<boolean> {
  if (!OWNER_EMAIL) {
    console.log('OWNER_EMAIL not set, skipping email notification');
    return false;
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set, skipping email notification');
    return false;
  }

  const itemsList = order.items
    .map(item => `<tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${item.name}
        ${item.customNotes ? `<div style="margin-top: 8px; padding: 10px; background: #FFF8E7; border-left: 3px solid #D4AF37; font-size: 12px;">
          <strong style="color: #3D2B1F;">Custom Request Details:</strong><br>
          <pre style="margin: 5px 0 0; white-space: pre-wrap; font-family: inherit; color: #3D2B1F;">${item.customNotes}</pre>
        </div>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.customNotes ? 'Quote TBD' : '$' + (item.price * item.quantity)}</td>
    </tr>`)
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Georgia', serif; background-color: #F4C2C2; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; }
    .header { background-color: #3D2B1F; color: #F4C2C2; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; }
    .content { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section-title { color: #3D2B1F; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 2px solid #D4AF37; padding-bottom: 5px; }
    .info-row { margin: 8px 0; color: #3D2B1F; }
    .label { color: #888; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #3D2B1F; color: #F4C2C2; padding: 12px; text-align: left; }
    .total { background: #F4C2C2; padding: 20px; text-align: right; font-size: 24px; color: #3D2B1F; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💎 NEW ORDER RECEIVED</h1>
      <p style="margin: 10px 0 0; opacity: 0.8;">Order #${order.id.slice(0, 8)}</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">Customer Details</div>
        <div class="info-row"><span class="label">Name:</span> <strong>${order.customerName}</strong></div>
        <div class="info-row"><span class="label">Phone:</span> <a href="tel:${order.customerPhone}">${order.customerPhone}</a></div>
        <div class="info-row"><span class="label">Email:</span> <a href="mailto:${order.customerEmail}">${order.customerEmail}</a></div>
      </div>
      
      <div class="section">
        <div class="section-title">Delivery Address</div>
        <div class="info-row">${order.deliveryAddress}</div>
      </div>
      
      ${order.specialInstructions ? `
      <div class="section">
        <div class="section-title">Special Instructions</div>
        <div class="info-row">${order.specialInstructions}</div>
      </div>
      ` : ''}
      
      <div class="section">
        <div class="section-title">Order Items</div>
        <table>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
          </tr>
          ${itemsList}
        </table>
      </div>
    </div>
    
    <div class="total">
      <span style="font-size: 14px; color: #888;">TOTAL (Pay on Delivery):</span><br>
      <strong>$${order.total}</strong>
    </div>
    
    <div class="footer">
      Diamond Dulceria • Premium Artisan Confections
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: 'Diamond Dulceria <onboarding@resend.dev>',
      to: OWNER_EMAIL,
      subject: `💎 New Order from ${order.customerName} - $${order.total}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log('Order notification sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
}

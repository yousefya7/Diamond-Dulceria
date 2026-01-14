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

// Check if order has any bespoke/custom items
function hasCustomItems(items: OrderItem[]): boolean {
  return items.some(item => item.customNotes);
}

// Send confirmation email to customer
export async function sendCustomerConfirmation(order: OrderData): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log('Email skipped: API key not found');
    return false;
  }

  const hasBespoke = hasCustomItems(order.items);

  const itemsList = order.items
    .map(item => `<tr>
      <td style="padding: 14px; border-bottom: 1px solid #eee;">
        <strong style="color: #3D2B1F;">${item.name}</strong>
        ${item.customNotes ? `<div style="margin-top: 10px; padding: 12px; background: linear-gradient(135deg, #FFF8E7 0%, #FFF5E0 100%); border-left: 3px solid #D4AF37; border-radius: 0 8px 8px 0;">
          <strong style="color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Your Custom Request:</strong>
          <pre style="margin: 8px 0 0; white-space: pre-wrap; font-family: Georgia, serif; color: #3D2B1F; font-size: 13px;">${item.customNotes}</pre>
        </div>` : ''}
      </td>
      <td style="padding: 14px; border-bottom: 1px solid #eee; text-align: center; color: #3D2B1F;">${item.quantity}</td>
      <td style="padding: 14px; border-bottom: 1px solid #eee; text-align: right; color: #3D2B1F; font-weight: bold;">${item.customNotes ? '<em style="color: #D4AF37;">Quote TBD</em>' : '$' + (item.price * item.quantity)}</td>
    </tr>`)
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Georgia', serif; background-color: #F4C2C2; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(61, 43, 31, 0.15); }
    .header { background: linear-gradient(135deg, #3D2B1F 0%, #2a1e15 100%); color: #F4C2C2; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 26px; letter-spacing: 3px; }
    .diamond { font-size: 40px; margin-bottom: 15px; }
    .content { padding: 35px; }
    .greeting { font-size: 18px; color: #3D2B1F; margin-bottom: 20px; }
    .section { margin-bottom: 28px; }
    .section-title { color: #3D2B1F; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; border-bottom: 2px solid #D4AF37; padding-bottom: 8px; display: inline-block; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #3D2B1F; color: #F4C2C2; padding: 14px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .pickup-notice { background: linear-gradient(135deg, #3D2B1F 0%, #4a3828 100%); color: #F4C2C2; padding: 20px 25px; border-radius: 12px; margin: 25px 0; text-align: center; }
    .pickup-notice strong { display: block; font-size: 14px; letter-spacing: 1px; margin-bottom: 8px; }
    .bespoke-notice { background: linear-gradient(135deg, #FFF8E7 0%, #FFF5E0 100%); border: 2px solid #D4AF37; padding: 20px 25px; border-radius: 12px; margin: 25px 0; }
    .bespoke-notice h4 { color: #D4AF37; margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .bespoke-notice p { color: #3D2B1F; margin: 0; font-size: 14px; line-height: 1.6; }
    .total { background: linear-gradient(135deg, #F4C2C2 0%, #f0b8b8 100%); padding: 25px; text-align: right; }
    .total-label { font-size: 12px; color: #3D2B1F; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; }
    .total-amount { font-size: 28px; color: #3D2B1F; font-weight: bold; margin-top: 5px; }
    .footer { text-align: center; padding: 30px; background: #fafafa; }
    .footer p { color: #888; font-size: 12px; margin: 5px 0; }
    .brand { color: #3D2B1F; font-size: 14px; letter-spacing: 2px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="diamond">💎</div>
      <h1>ORDER CONFIRMED</h1>
      <p style="margin: 15px 0 0; opacity: 0.8; font-size: 14px; letter-spacing: 1px;">Order #${order.id.slice(0, 8).toUpperCase()}</p>
    </div>
    
    <div class="content">
      <p class="greeting">Dear ${order.customerName},</p>
      <p style="color: #3D2B1F; line-height: 1.7; margin-bottom: 25px;">Thank you for your order with Diamond Dulceria! We're thrilled to craft something special for you. Here's a summary of your order:</p>
      
      <div class="section">
        <div class="section-title">Order Summary</div>
        <table>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
          </tr>
          ${itemsList}
        </table>
      </div>
      
      <div class="pickup-notice">
        <strong>📍 PICKUP REMINDER</strong>
        <p style="margin: 0; font-size: 14px; line-height: 1.6;">All orders must be picked up unless delivery was coordinated beforehand. We will contact you when your order is ready!</p>
      </div>
      
      ${hasBespoke ? `
      <div class="bespoke-notice">
        <h4>✨ Custom Order Note</h4>
        <p>Your bespoke creation is currently being reviewed by our artisan team. Keep an eye out for a follow-up email with your custom quote and approval confirmation!</p>
      </div>
      ` : ''}
      
      <div class="section">
        <div class="section-title">What's Next?</div>
        <ol style="color: #3D2B1F; line-height: 1.8; padding-left: 20px;">
          <li>We'll begin preparing your artisan confections</li>
          ${hasBespoke ? '<li>For custom orders, we\'ll send a quote and await your approval</li>' : ''}
          <li>You'll receive a notification when your order is ready for pickup</li>
          <li>Pay on pickup - cash or card accepted</li>
        </ol>
      </div>
    </div>
    
    <div class="total">
      <div class="total-label">Order Total (Pay on Pickup)</div>
      <div class="total-amount">${hasBespoke ? 'Quote Pending' : '$' + order.total}</div>
    </div>
    
    <div class="footer">
      <div class="brand">DIAMOND DULCERIA</div>
      <p>Premium Artisan Confections • Est. 2025</p>
      <p style="margin-top: 15px;">Questions? Reply to this email or contact us directly.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: 'Orders <orders@diamonddulceria.com>',
      to: order.customerEmail,
      subject: 'Thank you for your order! 🍫',
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error (customer confirmation):', error);
      return false;
    }

    console.log('Customer confirmation sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send customer confirmation:', error);
    return false;
  }
}

// Send order notification to business owner
export async function sendOrderNotification(order: OrderData): Promise<boolean> {
  if (!OWNER_EMAIL) {
    console.log('OWNER_EMAIL not set, skipping email notification');
    return false;
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('Email skipped: API key not found');
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
        <div class="section-title">Billing Address</div>
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
      from: 'Orders <orders@diamonddulceria.com>',
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

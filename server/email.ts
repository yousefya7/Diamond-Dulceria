import nodemailer from 'nodemailer';

const OWNER_EMAIL = process.env.OWNER_EMAIL || '';

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
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

  const itemsList = order.items
    .map(item => `• ${item.name} (x${item.quantity}) - $${item.price * item.quantity}`)
    .join('\n');

  const emailContent = `
NEW ORDER RECEIVED!

Order ID: ${order.id}

CUSTOMER DETAILS:
Name: ${order.customerName}
Phone: ${order.customerPhone}
Email: ${order.customerEmail}

DELIVERY ADDRESS:
${order.deliveryAddress}

${order.specialInstructions ? `SPECIAL INSTRUCTIONS:\n${order.specialInstructions}\n` : ''}
ORDER ITEMS:
${itemsList}

TOTAL: $${order.total} (Pay on Delivery)

---
Diamond Dulceria Order System
  `.trim();

  try {
    // For production, you would configure a proper SMTP transport
    // For now, we'll log the order and return true to indicate success
    console.log('========================================');
    console.log('NEW ORDER NOTIFICATION');
    console.log('Would send to:', OWNER_EMAIL);
    console.log('========================================');
    console.log(emailContent);
    console.log('========================================');
    
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
}

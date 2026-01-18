import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { sendOrderNotification, sendCustomerConfirmation } from './email';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    
    // First, let stripe-replit-sync process the webhook for data sync
    await sync.processWebhook(payload, signature);
    
    // Verify and handle webhook events
    try {
      const stripe = await getUncachableStripeClient();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.log('STRIPE_WEBHOOK_SECRET not set, skipping custom event handling');
        return;
      }
      
      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      console.log(`Webhook received: ${event.type}`);
      
      // Handle checkout.session.completed
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        
        // Log customer info
        console.log('=== PAYMENT SUCCESSFUL ===');
        console.log('Customer Name:', session.customer_details?.name || 'N/A');
        console.log('Customer Email:', session.customer_details?.email || 'N/A');
        
        // Log transaction details
        const amountTotal = session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00';
        console.log('Amount:', `$${amountTotal} ${(session.currency || 'usd').toUpperCase()}`);
        console.log('Payment Intent:', session.payment_intent || 'N/A');
        
        // Log metadata (what they bought)
        if (session.metadata && Object.keys(session.metadata).length > 0) {
          console.log('Metadata:', JSON.stringify(session.metadata, null, 2));
        }
        
        // Handle order update if orderId is in metadata
        if (session.payment_status === 'paid' && session.metadata?.orderId) {
          const orderId = session.metadata.orderId;
          const order = await storage.getOrder(orderId);
          
          if (order && order.status === 'pending') {
            await storage.updateOrderPayment(orderId, session.payment_intent as string, 'paid');
            
            try {
              await Promise.all([
                sendOrderNotification({
                  id: order.id,
                  customerName: order.customerName,
                  customerEmail: order.customerEmail,
                  customerPhone: order.customerPhone,
                  deliveryAddress: order.deliveryAddress,
                  specialInstructions: order.specialInstructions,
                  items: order.items,
                  total: order.total,
                }),
                sendCustomerConfirmation({
                  id: order.id,
                  customerName: order.customerName,
                  customerEmail: order.customerEmail,
                  customerPhone: order.customerPhone,
                  deliveryAddress: order.deliveryAddress,
                  specialInstructions: order.specialInstructions,
                  items: order.items,
                  total: order.total,
                }),
              ]);
              console.log(`Order ${orderId} confirmed and emails sent`);
            } catch (emailError) {
              console.error("Webhook email error:", emailError);
            }
          }
        }
        console.log('==========================');
      }
      
      // Handle payment_intent.succeeded (for inline Payment Element flow)
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as any;
        
        console.log('=== PAYMENT INTENT SUCCEEDED ===');
        console.log('Payment Intent ID:', paymentIntent.id);
        const amount = paymentIntent.amount ? (paymentIntent.amount / 100).toFixed(2) : '0.00';
        console.log('Amount:', `$${amount} ${(paymentIntent.currency || 'usd').toUpperCase()}`);
        
        if (paymentIntent.metadata && Object.keys(paymentIntent.metadata).length > 0) {
          console.log('Metadata:', JSON.stringify(paymentIntent.metadata, null, 2));
        }
        console.log('================================');
      }
      
      // Handle payment failures
      if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as any;
        
        console.log('=== PAYMENT FAILED ===');
        console.log('Payment Intent ID:', paymentIntent.id);
        console.log('Failure Reason:', paymentIntent.last_payment_error?.message || 'Unknown error');
        console.log('Decline Code:', paymentIntent.last_payment_error?.decline_code || 'N/A');
        
        const amount = paymentIntent.amount ? (paymentIntent.amount / 100).toFixed(2) : '0.00';
        console.log('Attempted Amount:', `$${amount} ${(paymentIntent.currency || 'usd').toUpperCase()}`);
        
        if (paymentIntent.metadata && Object.keys(paymentIntent.metadata).length > 0) {
          console.log('Metadata:', JSON.stringify(paymentIntent.metadata, null, 2));
        }
        console.log('======================');
      }
      
    } catch (eventError: any) {
      console.error('Webhook verification/handling error:', eventError.message);
    }
  }
}

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
    
    // Then, handle checkout.session.completed for our custom logic
    try {
      const stripe = await getUncachableStripeClient();
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
      
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        if (session.payment_status === 'paid' && session.metadata?.orderId) {
          const orderId = session.metadata.orderId;
          const order = await storage.getOrder(orderId);
          
          if (order && order.status === 'pending') {
            // Update order status to paid
            await storage.updateOrderPayment(orderId, session.payment_intent as string, 'paid');
            
            // Send confirmation emails
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
              console.log(`Order ${orderId} paid and emails sent via webhook`);
            } catch (emailError) {
              console.error("Webhook email error:", emailError);
            }
          }
        }
      }
    } catch (eventError: any) {
      // If webhook secret isn't set or event construction fails, log but don't throw
      // The sync.processWebhook already succeeded for data sync
      console.log('Custom event handling skipped:', eventError.message);
    }
  }
}

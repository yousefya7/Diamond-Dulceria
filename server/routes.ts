import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema } from "@shared/schema";
import { sendOrderNotification, sendCustomerConfirmation } from "./email";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { registerAdminRoutes } from "./adminRoutes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register admin routes
  registerAdminRoutes(app);

  // Create order endpoint
  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      
      const orderData = {
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        specialInstructions: order.specialInstructions,
        items: order.items,
        total: order.total,
      };
      
      // Send emails
      try {
        await Promise.all([
          sendOrderNotification(orderData),
          sendCustomerConfirmation(orderData),
        ]);
      } catch (emailError) {
        console.error("Email error:", emailError);
      }
      
      res.status(201).json({ success: true, order });
    } catch (error: any) {
      console.error("Error creating order:", error);
      res.status(400).json({ success: false, error: error?.message || "Failed to create order" });
    }
  });

  // Get all orders endpoint (for admin view in future)
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json({ success: true, orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ success: false, error: "Failed to fetch orders" });
    }
  });

  // Get Stripe publishable key
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ error: "Failed to get Stripe configuration" });
    }
  });

  // Create Stripe payment intent for embedded checkout
  app.post("/api/checkout/create-payment-intent", async (req, res) => {
    try {
      const { items, customerEmail, customerName, customerPhone, deliveryAddress, specialInstructions } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Items are required" });
      }

      if (!customerName || !customerEmail) {
        return res.status(400).json({ error: "Customer name and email are required" });
      }

      // Validate prices server-side from database
      const dbProducts = await storage.getAllProducts();
      const productPriceMap = new Map(dbProducts.map(p => [p.id, p.price]));
      
      let total = 0;
      const validatedItems = [];
      
      for (const item of items) {
        if (!item.id || typeof item.quantity !== 'number' || item.quantity < 1) {
          return res.status(400).json({ error: "Invalid item data" });
        }
        
        const dbPrice = productPriceMap.get(item.id);
        if (dbPrice === undefined) {
          return res.status(400).json({ error: `Product not found: ${item.id}` });
        }
        
        const price = parseFloat(dbPrice);
        total += price * item.quantity;
        validatedItems.push({ ...item, price });
      }
      
      // Create order first
      const order = await storage.createOrder({
        customerName: customerName || '',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
        deliveryAddress: deliveryAddress || '',
        specialInstructions: specialInstructions || null,
        items: validatedItems,
        total: total,
      });

      const stripe = await getUncachableStripeClient();

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Convert to cents
        currency: 'usd',
        payment_method_types: ['card', 'cashapp', 'link'],
        metadata: {
          orderId: order.id,
          customerEmail: customerEmail || '',
          customerName: customerName || '',
          customerPhone: customerPhone || '',
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId: order.id
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: error.message || "Failed to create payment" });
    }
  });

  // Confirm payment and update order status
  app.post("/api/checkout/confirm-payment", async (req, res) => {
    try {
      const { orderId, paymentIntentId } = req.body;
      
      if (!orderId || !paymentIntentId) {
        return res.status(400).json({ error: "Order ID and Payment Intent ID are required" });
      }

      const stripe = await getUncachableStripeClient();
      
      // Verify payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment not yet completed" });
      }
      
      // Verify orderId matches payment intent metadata
      if (paymentIntent.metadata?.orderId !== orderId) {
        return res.status(400).json({ error: "Order ID mismatch" });
      }

      // Update order status to paid
      const order = await storage.updateOrderStatus(orderId, 'paid');
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Send confirmation emails
      const orderData = {
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        specialInstructions: order.specialInstructions,
        items: order.items,
        total: order.total,
      };
      
      try {
        await Promise.all([
          sendOrderNotification(orderData),
          sendCustomerConfirmation(orderData),
        ]);
      } catch (emailError) {
        console.error("Email error:", emailError);
      }

      res.json({ success: true, order });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: error.message || "Failed to confirm payment" });
    }
  });

  // Create full Stripe checkout session (legacy - kept for compatibility)
  app.post("/api/checkout/create-session", async (req, res) => {
    try {
      const { items, customerEmail, customerName, customerPhone, deliveryAddress, specialInstructions } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Items are required" });
      }

      // Validate prices server-side from database
      const dbProducts = await storage.getAllProducts();
      const productPriceMap = new Map(dbProducts.map(p => [p.id, p.price]));
      
      let total = 0;
      const validatedItems = [];
      
      for (const item of items) {
        if (!item.id || typeof item.quantity !== 'number' || item.quantity < 1) {
          return res.status(400).json({ error: "Invalid item data" });
        }
        
        const dbPrice = productPriceMap.get(item.id);
        if (dbPrice === undefined) {
          return res.status(400).json({ error: `Product not found: ${item.id}` });
        }
        
        const price = parseFloat(dbPrice);
        total += price * item.quantity;
        validatedItems.push({ ...item, price });
      }

      // Create order first with "pending_payment" status
      const order = await storage.createOrder({
        customerName: customerName || '',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
        deliveryAddress: deliveryAddress || '',
        specialInstructions: specialInstructions || null,
        items: validatedItems,
        total: total,
      });

      const stripe = await getUncachableStripeClient();
      
      // Create line items for Stripe using validated prices
      const lineItems = validatedItems.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.customNotes || undefined,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

      const host = req.get('host');
      const protocol = req.protocol;
      const baseUrl = `${protocol}://${host}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'cashapp', 'link'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${baseUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/?payment=cancelled`,
        customer_email: customerEmail,
        automatic_tax: { enabled: false },
        metadata: {
          orderId: order.id,
          customerName: customerName || '',
          customerPhone: customerPhone || '',
          deliveryAddress: deliveryAddress || '',
          specialInstructions: specialInstructions || '',
        },
      });

      res.json({ url: session.url, sessionId: session.id, orderId: order.id });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout" });
    }
  });

  // Get checkout session status (read-only - webhooks handle order updates/emails)
  app.get("/api/checkout/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const stripe = await getUncachableStripeClient();
      
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      // For immediate frontend feedback, also update order if paid
      // (Webhook may not have processed yet, this provides backup)
      if (session.payment_status === 'paid' && session.metadata?.orderId) {
        const orderId = session.metadata.orderId;
        const order = await storage.getOrder(orderId);
        
        if (order && order.status === 'pending') {
          await storage.updateOrderPayment(orderId, session.payment_intent as string, 'paid');
          
          // Send emails as backup (webhook should handle this, but in case it hasn't yet)
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
          } catch (emailError) {
            console.error("Email error:", emailError);
          }
        }
      }
      
      res.json({ 
        status: session.payment_status,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
        orderId: session.metadata?.orderId,
      });
    } catch (error: any) {
      console.error("Error getting session:", error);
      res.status(500).json({ error: error.message || "Failed to get session" });
    }
  });

  return httpServer;
}

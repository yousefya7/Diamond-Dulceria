import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema } from "@shared/schema";
import { sendOrderNotification, sendCustomerConfirmation } from "./email";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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

  // Create Stripe checkout session for order payment
  app.post("/api/checkout/create-payment-intent", async (req, res) => {
    try {
      const { orderId, items, customerEmail, customerName } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Items are required" });
      }

      const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity * 100), 0);
      
      const stripe = await getUncachableStripeClient();

      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId: orderId || '',
          customerEmail: customerEmail || '',
          customerName: customerName || '',
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: error.message || "Failed to create payment" });
    }
  });

  // Create full Stripe checkout session
  app.post("/api/checkout/create-session", async (req, res) => {
    try {
      const { items, customerEmail, customerName, customerPhone, deliveryAddress, specialInstructions } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Items are required" });
      }

      const stripe = await getUncachableStripeClient();
      
      // Create line items for Stripe
      const lineItems = items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.customNotes || undefined,
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      }));

      const host = req.get('host');
      const protocol = req.protocol;
      const baseUrl = `${protocol}://${host}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${baseUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/?payment=cancelled`,
        customer_email: customerEmail,
        metadata: {
          customerName: customerName || '',
          customerPhone: customerPhone || '',
          deliveryAddress: deliveryAddress || '',
          specialInstructions: specialInstructions || '',
          items: JSON.stringify(items),
        },
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout" });
    }
  });

  // Get checkout session status
  app.get("/api/checkout/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const stripe = await getUncachableStripeClient();
      
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      res.json({ 
        status: session.payment_status,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
      });
    } catch (error: any) {
      console.error("Error getting session:", error);
      res.status(500).json({ error: error.message || "Failed to get session" });
    }
  });

  return httpServer;
}

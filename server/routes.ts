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

  // Validate promo code (public endpoint for checkout)
  app.post("/api/promo-code/validate", async (req, res) => {
    try {
      const { code, subtotal } = req.body;
      if (!code || typeof subtotal !== "number") {
        return res.status(400).json({ success: false, error: "Code and subtotal required" });
      }
      const promoCode = await storage.getPromoCodeByCode(code.toUpperCase().trim());
      if (!promoCode) {
        return res.status(404).json({ success: false, error: "Invalid promo code" });
      }
      if (!promoCode.active) {
        return res.status(400).json({ success: false, error: "This promo code is no longer active" });
      }
      let discountAmount = 0;
      if (promoCode.discountType === "percentage") {
        discountAmount = Math.round((subtotal * promoCode.discountValue) / 100);
      } else {
        // Fixed discount stored in dollars
        discountAmount = promoCode.discountValue;
      }
      discountAmount = Math.min(discountAmount, subtotal);
      const newTotal = subtotal - discountAmount;
      res.json({
        success: true,
        promoCode: {
          code: promoCode.code,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue,
        },
        discountAmount,
        newTotal,
      });
    } catch (error: any) {
      console.error("Error validating promo code:", error);
      res.status(500).json({ success: false, error: "Failed to validate promo code" });
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

  // Create Stripe payment intent for inline checkout (payment-first flow)
  // This creates a PaymentIntent without creating an order
  app.post("/api/checkout/prepare-payment", async (req, res) => {
    try {
      const { items, promoCode, discountAmount } = req.body;
      console.log("Prepare payment request:", JSON.stringify({ items, promoCode, discountAmount }));
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Items are required" });
      }

      // Validate prices server-side from database
      const dbProducts = await storage.getAllProducts();
      const productIdMap = new Map(dbProducts.map(p => [String(p.id), p]));
      const productNameMap = new Map(dbProducts.map(p => [p.name.toLowerCase(), p]));
      
      let subtotal = 0;
      const validatedItems = [];
      
      for (const item of items) {
        if (!item.id || typeof item.quantity !== 'number' || item.quantity < 1) {
          return res.status(400).json({ error: "Invalid item data" });
        }
        
        const itemId = String(item.id);
        let dbProduct = productIdMap.get(itemId);
        
        // Fallback: match by name if ID not found (for legacy cart items)
        if (!dbProduct && item.name) {
          dbProduct = productNameMap.get(item.name.toLowerCase());
        }
        
        if (!dbProduct) {
          console.log(`Product not found for item: ${JSON.stringify(item)}`);
          return res.status(400).json({ error: `Product not found: ${item.name || itemId}` });
        }
        
        const price = Number(dbProduct.price);
        subtotal += price * item.quantity;
        validatedItems.push({ ...item, id: dbProduct.id, price });
      }

      // Validate promo code server-side if provided
      let validatedDiscount = 0;
      let validatedPromoCode = null;
      if (promoCode && typeof discountAmount === 'number' && discountAmount > 0) {
        const promo = await storage.getPromoCodeByCode(promoCode);
        if (promo && promo.active) {
          if (promo.discountType === "percentage") {
            validatedDiscount = Math.round((subtotal * promo.discountValue) / 100);
          } else {
            // Fixed discount stored in dollars
            validatedDiscount = promo.discountValue;
          }
          validatedDiscount = Math.min(validatedDiscount, subtotal);
          validatedPromoCode = promo.code;
        }
      }

      const total = Math.max(0, subtotal - validatedDiscount);

      // If total is $0, skip payment (custom orders only)
      if (total === 0) {
        return res.json({ 
          clientSecret: null,
          paymentIntentId: null,
          validatedTotal: 0,
          validatedItems,
          skipPayment: true,
          promoCode: validatedPromoCode,
          discountAmount: validatedDiscount,
        });
      }

      const stripe = await getUncachableStripeClient();
      
      // Create a hash of item IDs for verification
      const itemIds = validatedItems.map((item: any) => `${item.id}:${item.quantity}`).sort().join(',');

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: 'usd',
        payment_method_types: ['card', 'cashapp', 'link'],
        metadata: {
          validatedTotal: String(total),
          subtotal: String(subtotal),
          promoCode: validatedPromoCode || '',
          discountAmount: String(validatedDiscount),
          itemHash: itemIds,
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        validatedTotal: total,
        validatedItems,
        skipPayment: false,
        promoCode: validatedPromoCode,
        discountAmount: validatedDiscount,
      });
    } catch (error: any) {
      console.error("Error preparing payment:", error);
      res.status(500).json({ error: error.message || "Failed to prepare payment" });
    }
  });

  // Complete order after payment succeeds (payment-first flow)
  // Creates order and sends emails only after payment is verified
  app.post("/api/checkout/complete-order", async (req, res) => {
    try {
      const { paymentIntentId, customerName, customerEmail, customerPhone, deliveryAddress, specialInstructions, items } = req.body;
      
      if (!paymentIntentId || !customerName || !customerEmail) {
        return res.status(400).json({ error: "Payment intent ID, customer name, and email are required" });
      }

      const stripe = await getUncachableStripeClient();
      
      // Verify payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      // Validate prices server-side from database
      const dbProducts = await storage.getAllProducts();
      const productIdMap = new Map(dbProducts.map(p => [String(p.id), p]));
      const productNameMap = new Map(dbProducts.map(p => [p.name.toLowerCase(), p]));
      
      let total = 0;
      const validatedItems = [];
      
      for (const item of items) {
        const itemId = String(item.id);
        let dbProduct = productIdMap.get(itemId);
        
        // Fallback: match by name if ID not found (for legacy cart items)
        if (!dbProduct && item.name) {
          dbProduct = productNameMap.get(item.name.toLowerCase());
        }
        
        if (!dbProduct) {
          console.log(`Complete order - Product not found: ${JSON.stringify(item)}`);
          return res.status(400).json({ error: `Product not found: ${item.name || itemId}` });
        }
        
        const price = Number(dbProduct.price);
        total += price * item.quantity;
        validatedItems.push({ ...item, id: dbProduct.id, price });
      }
      
      // Verify PaymentIntent amount matches calculated total
      const expectedAmount = Math.round(total * 100);
      if (paymentIntent.amount !== expectedAmount) {
        return res.status(400).json({ error: "Payment amount mismatch" });
      }
      
      // Verify item hash matches if present in metadata
      const itemIds = validatedItems.map((item: any) => `${item.id}:${item.quantity}`).sort().join(',');
      if (paymentIntent.metadata?.itemHash && paymentIntent.metadata.itemHash !== itemIds) {
        return res.status(400).json({ error: "Cart mismatch - items changed since payment" });
      }

      // Create order and immediately set to paid status
      const createdOrder = await storage.createOrder({
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        deliveryAddress: deliveryAddress || '',
        specialInstructions: specialInstructions || null,
        items: validatedItems,
        total,
      });
      
      // Update to paid status
      const order = await storage.updateOrderStatus(createdOrder.id, 'paid');
      
      if (!order) {
        return res.status(500).json({ error: "Failed to update order status" });
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
      console.error("Error completing order:", error);
      res.status(500).json({ error: error.message || "Failed to complete order" });
    }
  });

  // Submit order without payment (for $0 custom orders only)
  app.post("/api/checkout/submit-free-order", async (req, res) => {
    try {
      const { customerName, customerEmail, customerPhone, deliveryAddress, specialInstructions, items } = req.body;
      
      if (!customerName || !customerEmail) {
        return res.status(400).json({ error: "Customer name and email are required" });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Items are required" });
      }

      // Validate that total is actually $0
      const dbProducts = await storage.getAllProducts();
      const productIdMap = new Map(dbProducts.map(p => [String(p.id), p]));
      const productNameMap = new Map(dbProducts.map(p => [p.name.toLowerCase(), p]));
      
      let total = 0;
      const validatedItems = [];
      
      for (const item of items) {
        const itemId = String(item.id);
        let dbProduct = productIdMap.get(itemId);
        
        if (!dbProduct && item.name) {
          dbProduct = productNameMap.get(item.name.toLowerCase());
        }
        
        if (!dbProduct) {
          return res.status(400).json({ error: `Product not found: ${item.name || itemId}` });
        }
        
        const price = Number(dbProduct.price);
        total += price * item.quantity;
        validatedItems.push({ ...item, id: dbProduct.id, price });
      }

      // Only allow $0 orders through this endpoint
      if (total > 0) {
        return res.status(400).json({ error: "This endpoint is only for $0 orders. Please use regular checkout for paid orders." });
      }

      // Create order with pending status (custom orders need approval)
      const order = await storage.createOrder({
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        deliveryAddress: deliveryAddress || '',
        specialInstructions: specialInstructions || null,
        items: validatedItems,
        total: 0,
      });

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
      console.error("Error submitting free order:", error);
      res.status(500).json({ error: error.message || "Failed to submit order" });
    }
  });

  // Legacy: Create Stripe payment intent (kept for compatibility)
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
      const productPriceMap = new Map(dbProducts.map(p => [String(p.id), p.price]));
      
      let total = 0;
      const validatedItems = [];
      
      for (const item of items) {
        if (!item.id || typeof item.quantity !== 'number' || item.quantity < 1) {
          return res.status(400).json({ error: "Invalid item data" });
        }
        
        const itemId = String(item.id);
        const dbPrice = productPriceMap.get(itemId);
        if (dbPrice === undefined) {
          return res.status(400).json({ error: `Product not found: ${itemId}` });
        }
        
        const price = Number(dbPrice);
        total += price * item.quantity;
        validatedItems.push({ ...item, id: itemId, price });
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
        amount: Math.round(total * 100),
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

  // Legacy: Confirm payment and update order status
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
      const productPriceMap = new Map(dbProducts.map(p => [String(p.id), p.price]));
      
      let total = 0;
      const validatedItems = [];
      
      for (const item of items) {
        if (!item.id || typeof item.quantity !== 'number' || item.quantity < 1) {
          return res.status(400).json({ error: "Invalid item data" });
        }
        
        const itemId = String(item.id);
        const dbPrice = productPriceMap.get(itemId);
        if (dbPrice === undefined) {
          return res.status(400).json({ error: `Product not found: ${itemId}` });
        }
        
        const price = Number(dbPrice);
        total += price * item.quantity;
        validatedItems.push({ ...item, id: itemId, price });
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

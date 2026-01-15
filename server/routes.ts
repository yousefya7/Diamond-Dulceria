import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema } from "@shared/schema";
import { sendOrderNotification, sendCustomerConfirmation } from "./email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Create order endpoint
  app.post("/api/orders", async (req, res) => {
    console.log("[ORDER] Received order request:", JSON.stringify(req.body, null, 2));
    
    try {
      // Validate input
      console.log("[ORDER] Validating order data...");
      const validatedData = insertOrderSchema.parse(req.body);
      console.log("[ORDER] Validation passed");
      
      // Save to database
      console.log("[ORDER] Saving to database...");
      const order = await storage.createOrder(validatedData);
      console.log("[ORDER] Order saved with ID:", order.id);
      
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
      
      // Send emails (non-blocking - don't let email failures break order)
      console.log("[ORDER] Sending emails...");
      try {
        await Promise.all([
          sendOrderNotification(orderData),
          sendCustomerConfirmation(orderData),
        ]);
        console.log("[ORDER] Emails sent successfully");
      } catch (emailError) {
        console.error("[ORDER] Email error (order still saved):", emailError);
      }
      
      res.status(201).json({ success: true, order });
    } catch (error: any) {
      console.error("[ORDER] Error creating order:", error);
      const errorMessage = error?.message || "Unknown error";
      const errorDetails = error?.errors || error?.issues || null;
      res.status(400).json({ 
        success: false, 
        error: errorMessage,
        details: errorDetails
      });
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

  return httpServer;
}

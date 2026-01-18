import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { insertProductSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import { sendEmail, sendStatusChangeEmail } from "./email";

const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "diamond-dulceria-admin-2024";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dymonlhf@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Dymon1234";

function verifyAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email, timestamp] = decoded.split("|");
    const tokenTime = parseInt(timestamp);
    if (Date.now() - tokenTime > 7 * 24 * 60 * 60 * 1000) {
      return res.status(401).json({ error: "Token expired" });
    }
    (req as any).adminEmail = email;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function registerAdminRoutes(app: Express) {
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Try env-based authentication first (works on all environments)
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const token = Buffer.from(`${email}|${Date.now()}`).toString("base64");
        return res.json({ 
          success: true, 
          token, 
          admin: { email: ADMIN_EMAIL, name: "Diamond Dulceria Admin" } 
        });
      }

      // Fallback to database authentication
      const admin = await storage.getAdminByEmail(email);
      if (admin) {
        const validPassword = await bcrypt.compare(password, admin.passwordHash);
        if (validPassword) {
          const token = Buffer.from(`${email}|${Date.now()}`).toString("base64");
          return res.json({ success: true, token, admin: { email: admin.email, name: admin.name } });
        }
      }

      return res.status(401).json({ error: "Invalid credentials" });
    } catch (error: any) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/setup", async (req, res) => {
    try {
      const { email, password, name, setupKey } = req.body;
      if (setupKey !== ADMIN_SESSION_SECRET) {
        return res.status(403).json({ error: "Invalid setup key" });
      }

      const existing = await storage.getAdminByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Admin already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const admin = await storage.createAdmin({ email, passwordHash, name });
      res.json({ success: true, admin: { email: admin.email, name: admin.name } });
    } catch (error: any) {
      console.error("Admin setup error:", error);
      res.status(500).json({ error: "Setup failed" });
    }
  });

  app.get("/api/admin/orders", verifyAdminAuth, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json({ success: true, orders });
    } catch (error: any) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/admin/orders/:id/status", verifyAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status required" });
      }
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Send status change email to customer
      sendStatusChangeEmail({
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        status: order.status,
        total: order.total
      }).catch(err => console.error("Failed to send status email:", err));
      
      res.json({ success: true, order });
    } catch (error: any) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.patch("/api/admin/orders/:id/notes", verifyAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const order = await storage.updateOrderNotes(id, notes || "");
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json({ success: true, order });
    } catch (error: any) {
      console.error("Error updating order notes:", error);
      res.status(500).json({ error: "Failed to update notes" });
    }
  });

  app.post("/api/admin/orders/:id/quote", verifyAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { quotedPrice, message } = req.body;
      
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      await storage.updateOrderQuote(id, quotedPrice, "sent");

      await sendEmail({
        to: order.customerEmail,
        subject: `Quote for Your Custom Order - Diamond Dulceria`,
        html: `
          <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #FDF8F3;">
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #D4AF37;">
              <h1 style="color: #3D2B1F; margin: 0; font-size: 28px;">Diamond Dulceria</h1>
              <p style="color: #8B7355; margin: 5px 0 0; font-style: italic;">Artisan Confections</p>
            </div>
            <div style="padding: 30px 0;">
              <h2 style="color: #3D2B1F;">Hi ${order.customerName}!</h2>
              <p style="color: #555; line-height: 1.6;">Thank you for your custom order request! We've reviewed your order and prepared a quote for you.</p>
              
              <div style="background: #fff; border: 2px solid #D4AF37; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #3D2B1F; margin-top: 0;">Your Quote</h3>
                <p style="font-size: 24px; color: #D4AF37; font-weight: bold; margin: 10px 0;">$${(quotedPrice / 100).toFixed(2)}</p>
                ${message ? `<p style="color: #555; border-top: 1px solid #eee; padding-top: 15px; margin-top: 15px;">${message}</p>` : ''}
              </div>
              
              <p style="color: #555; line-height: 1.6;">To accept this quote and proceed with your order, please reply to this email or contact us.</p>
            </div>
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #D4AF37; color: #8B7355; font-size: 12px;">
              <p>Diamond Dulceria - Handcrafted with Love</p>
            </div>
          </div>
        `,
      });

      res.json({ success: true, order: { ...order, quotedPrice, quoteStatus: "sent" } });
    } catch (error: any) {
      console.error("Error sending quote:", error);
      res.status(500).json({ error: "Failed to send quote" });
    }
  });

  app.post("/api/admin/orders/:id/contact", verifyAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { subject, message } = req.body;
      
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      await sendEmail({
        to: order.customerEmail,
        subject: subject || `Update on Your Order - Diamond Dulceria`,
        html: `
          <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #FDF8F3;">
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #D4AF37;">
              <h1 style="color: #3D2B1F; margin: 0; font-size: 28px;">Diamond Dulceria</h1>
              <p style="color: #8B7355; margin: 5px 0 0; font-style: italic;">Artisan Confections</p>
            </div>
            <div style="padding: 30px 0;">
              <h2 style="color: #3D2B1F;">Hi ${order.customerName}!</h2>
              <div style="color: #555; line-height: 1.8; white-space: pre-wrap;">${message}</div>
            </div>
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #D4AF37; color: #8B7355; font-size: 12px;">
              <p>Diamond Dulceria - Handcrafted with Love</p>
            </div>
          </div>
        `,
      });

      res.json({ success: true, message: "Email sent" });
    } catch (error: any) {
      console.error("Error contacting customer:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.get("/api/admin/products", verifyAdminAuth, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json({ success: true, products });
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", verifyAdminAuth, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json({ success: true, product });
    } catch (error: any) {
      console.error("Error creating product:", error);
      res.status(400).json({ error: error?.message || "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", verifyAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.updateProduct(id, req.body);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json({ success: true, product });
    } catch (error: any) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", verifyAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  app.get("/api/admin/stats", verifyAdminAuth, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysOrders = orders.filter(o => new Date(o.createdAt) >= today);
      const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "paid");
      const readyForPickup = orders.filter(o => o.status === "ready");
      const totalRevenue = orders.filter(o => o.status === "completed" || o.status === "paid" || o.status === "ready")
        .reduce((sum, o) => sum + o.total, 0);
      
      res.json({
        success: true,
        stats: {
          todaysOrders: todaysOrders.length,
          pendingOrders: pendingOrders.length,
          readyForPickup: readyForPickup.length,
          totalRevenue,
          totalOrders: orders.length,
        }
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const activeProducts = products.filter(p => p.active);
      res.json({ success: true, products: activeProducts });
    } catch (error: any) {
      console.error("Error fetching public products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Seed products endpoint - imports default products into the database
  app.post("/api/admin/seed-products", verifyAdminAuth, async (req, res) => {
    try {
      const defaultProducts = [
        { 
          id: "dubai-chocolate", 
          name: "Dubai Chocolate Truffles", 
          price: 50, 
          batch: 25,
          description: "A rich pistachio cream filling, coated in silky milk chocolate and topped with a pistachio crunch and drizzle.",
          isCustom: false,
          category: "truffle",
          image: "/dubai_chocolate.png",
          trending: true,
          active: true
        },
        { 
          id: "cookie-butter", 
          name: "Cookie Butter Truffles", 
          price: 50, 
          batch: 25,
          description: "Spiced cookie filling wrapped in smooth white chocolate, finished with Biscoff crumb topping.",
          isCustom: false,
          category: "truffle",
          image: "/cookie_butter.png",
          trending: false,
          active: true
        },
        { 
          id: "strawberry-shortcake", 
          name: "Strawberry Shortcake Truffles", 
          price: 50, 
          batch: 25,
          description: "A rich strawberry-infused cheesecake filling enrobed in smooth pink white chocolate topped with a strawberry crumble.",
          isCustom: false,
          category: "truffle",
          image: "/strawberry_shortcake.png",
          trending: false,
          active: true
        },
        { 
          id: "cookies-cream", 
          name: "Cookies & Cream Truffles", 
          price: 50, 
          batch: 25,
          description: "Classic cookies & cream filling enrobed in milk chocolate, finished with a white chocolate drizzle and Oreo crumble.",
          isCustom: false,
          category: "truffle",
          image: "/cookies_cream.png",
          trending: false,
          active: true
        },
        { 
          id: "red-velvet", 
          name: "Red Velvet Cookies", 
          price: 50, 
          batch: 25,
          description: "Deep red cocoa base mixed with white chocolate chips, crushed Oreo cookies, and a smooth cream cheese swirl.",
          isCustom: false,
          category: "cookie",
          image: "/red_velvet.png",
          trending: false,
          active: true
        },
        { 
          id: "snickerdoodle", 
          name: "Snickerdoodle Cookies", 
          price: 50, 
          batch: 25,
          description: "Classic cinnamon-sugar dusting with soft, chewy center",
          isCustom: false,
          category: "cookie",
          image: "/snickerdoodle.png",
          trending: false,
          active: true
        },
        { 
          id: "signature-cookies", 
          name: "Signature Cookies", 
          price: 50, 
          batch: 25,
          description: "Our signature brown butter cookies with premium chocolate and sea salt",
          isCustom: false,
          category: "cookie",
          image: "/signature_cookies.png",
          trending: false,
          active: true
        },
        { 
          id: "chocolate-strawberries", 
          name: "Chocolate Covered Strawberries", 
          price: 50, 
          batch: 12,
          description: "Fresh strawberries dipped in rich chocolate with elegant drizzle and toppings.",
          isCustom: false,
          category: "seasonal",
          image: "/strawberries.jpg",
          trending: true,
          active: true
        },
        { 
          id: "pink-chocolate-cookies", 
          name: "Pink Chocolate Cookies", 
          price: 50, 
          batch: 25,
          description: "Soft-baked cookies with pink white chocolate chips and a touch of strawberry.",
          isCustom: false,
          category: "seasonal",
          image: "/pink-cookies.jpg",
          trending: true,
          active: true
        },
        { 
          id: "strawberry-truffles", 
          name: "Strawberry Truffles", 
          price: 50, 
          batch: 25,
          description: "Strawberry center with milk chocolate on the outside.",
          isCustom: false,
          category: "seasonal",
          image: "/strawberry-truffle.jpg",
          trending: true,
          active: true
        },
        { 
          id: "bespoke-diamond", 
          name: "Bespoke Creation", 
          price: 0, 
          batch: 0,
          description: "Custom flavors crafted exclusively for you. Subject to approval.",
          isCustom: true,
          category: "custom",
          image: "/bespoke_creation.png",
          trending: false,
          active: true
        },
      ];

      let imported = 0;
      let skipped = 0;
      
      for (const product of defaultProducts) {
        const existing = await storage.getProduct(product.id);
        if (!existing) {
          const { id, ...productData } = product;
          await storage.createProductWithId(id, productData);
          imported++;
        } else {
          skipped++;
        }
      }
      
      res.json({ 
        success: true, 
        message: `Imported ${imported} products, skipped ${skipped} existing products`,
        imported,
        skipped
      });
    } catch (error: any) {
      console.error("Error seeding products:", error);
      res.status(500).json({ error: "Failed to seed products" });
    }
  });
}

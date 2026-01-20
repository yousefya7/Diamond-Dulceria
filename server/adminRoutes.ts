import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema, insertPromoCodeSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import { sendEmail, sendStatusChangeEmail } from "./email";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ObjectStorageService } from "./replit_integrations/object_storage";

const objectStorageService = new ObjectStorageService();

const uploadDir = "public/uploads/products";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const productImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadProductImage = multer({
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  },
});

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

  app.post("/api/admin/reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      if (email !== ADMIN_EMAIL) {
        return res.status(400).json({ error: "Email not found" });
      }

      const newPassword = `DD${Date.now().toString(36).slice(-6)}`;
      
      await sendEmail({
        to: email,
        subject: "Diamond Dulceria - Password Reset",
        html: `
          <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #F9F1F1;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3D2B1F; font-size: 28px; margin: 0;">Diamond Dulceria</h1>
              <p style="color: #3D2B1F; opacity: 0.6; margin: 5px 0 0;">Password Reset</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; border: 1px solid rgba(61, 43, 31, 0.1);">
              <p style="color: #3D2B1F; font-size: 16px; line-height: 1.6;">Your password has been reset. Here is your new temporary password:</p>
              <div style="background: #F4C2C2; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="color: #3D2B1F; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">${newPassword}</p>
              </div>
              <p style="color: #3D2B1F; font-size: 14px; opacity: 0.7;">For security, please update your password in the Settings tab after logging in.</p>
            </div>
          </div>
        `,
      });

      console.log(`Password reset for ${email}. New password: ${newPassword}`);
      res.json({ success: true, message: "Password reset email sent" });
    } catch (error: any) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Failed to send reset email" });
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

  app.delete("/api/admin/orders/:id", verifyAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteOrder(id);
      res.json({ success: true, message: "Order deleted" });
    } catch (error: any) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: "Failed to delete order" });
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

  app.post("/api/admin/upload-image", verifyAdminAuth, uploadProductImage.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const imageUrl = `/uploads/products/${req.file.filename}`;
      res.json({ success: true, imageUrl });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  app.post("/api/admin/request-upload-url", verifyAdminAuth, async (req, res) => {
    try {
      const { name, contentType } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Missing file name" });
      }
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      res.json({ success: true, uploadURL, objectPath, metadata: { name, contentType } });
    } catch (error: any) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.post("/api/admin/finalize-upload", verifyAdminAuth, async (req, res) => {
    try {
      const { objectPath } = req.body;
      if (!objectPath) {
        return res.status(400).json({ error: "Missing object path" });
      }
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(objectPath);
      await objectStorageService.trySetObjectEntityAclPolicy(normalizedPath, {
        owner: "admin",
        visibility: "public",
      });
      res.json({ success: true, imageUrl: normalizedPath });
    } catch (error: any) {
      console.error("Error finalizing upload:", error);
      res.status(500).json({ error: "Failed to finalize upload" });
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

  // Site Settings endpoints
  app.get("/api/admin/settings", verifyAdminAuth, async (req, res) => {
    try {
      const settings = await storage.getAllSiteSettings();
      const settingsMap: Record<string, string> = {};
      settings.forEach(s => { settingsMap[s.key] = s.value; });
      res.json({ success: true, settings: settingsMap });
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings", verifyAdminAuth, async (req, res) => {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: "Settings object required" });
      }
      
      const updated: Record<string, string> = {};
      for (const [key, value] of Object.entries(settings)) {
        if (typeof value === 'string') {
          await storage.upsertSiteSetting(key, value);
          updated[key] = value;
        }
      }
      
      res.json({ success: true, settings: updated });
    } catch (error: any) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.post("/api/admin/settings/delete", verifyAdminAuth, async (req, res) => {
    try {
      const { key } = req.body;
      if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: "Key required" });
      }
      await storage.deleteSiteSetting(key);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ error: "Failed to delete setting" });
    }
  });

  // Public endpoint to get site settings for frontend
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAllSiteSettings();
      const settingsMap: Record<string, string> = {};
      settings.forEach(s => { settingsMap[s.key] = s.value; });
      res.json({ success: true, settings: settingsMap });
    } catch (error: any) {
      console.error("Error fetching public settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Categories endpoints (admin)
  app.get("/api/admin/categories", verifyAdminAuth, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json({ success: true, categories });
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", verifyAdminAuth, async (req, res) => {
    try {
      const parsed = insertCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid category data", details: parsed.error });
      }
      const existing = await storage.getCategoryBySlug(parsed.data.slug);
      if (existing) {
        return res.status(400).json({ error: "Category with this slug already exists" });
      }
      const category = await storage.createCategory(parsed.data);
      res.json({ success: true, category });
    } catch (error: any) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", verifyAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const category = await storage.updateCategory(id, updates);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json({ success: true, category });
    } catch (error: any) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", verifyAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCategory(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Public endpoint for categories (for navbar/frontend)
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getActiveCategories();
      res.json({ success: true, categories });
    } catch (error: any) {
      console.error("Error fetching public categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Seed default categories endpoint
  app.post("/api/admin/seed-categories", verifyAdminAuth, async (req, res) => {
    try {
      const defaultCategories = [
        { slug: "truffles", name: "Truffles", title: "Handcrafted Truffles", description: "Indulge in our signature collection of artisan chocolate truffles", displayOrder: 1, active: true },
        { slug: "cookies", name: "Cookies", title: "Signature Cookies", description: "Freshly baked cookies made with premium ingredients", displayOrder: 2, active: true },
        { slug: "seasonal", name: "Seasonal", title: "Seasonal Specials", description: "Limited edition treats for the season", displayOrder: 3, active: true },
        { slug: "custom", name: "Custom", title: "Custom Creations", description: "Bespoke confections crafted just for you", displayOrder: 4, active: true },
      ];
      let created = 0, skipped = 0;
      for (const cat of defaultCategories) {
        const existing = await storage.getCategoryBySlug(cat.slug);
        if (!existing) {
          await storage.createCategory(cat);
          created++;
        } else {
          skipped++;
        }
      }
      res.json({ success: true, message: `Created ${created} categories, skipped ${skipped} existing`, created, skipped });
    } catch (error: any) {
      console.error("Error seeding categories:", error);
      res.status(500).json({ error: "Failed to seed categories" });
    }
  });

  // Promo Codes Management
  app.get("/api/admin/promo-codes", verifyAdminAuth, async (req, res) => {
    try {
      const promoCodes = await storage.getAllPromoCodes();
      res.json({ success: true, promoCodes });
    } catch (error: any) {
      console.error("Error fetching promo codes:", error);
      res.status(500).json({ error: "Failed to fetch promo codes" });
    }
  });

  app.post("/api/admin/promo-codes", verifyAdminAuth, async (req, res) => {
    try {
      const parsed = insertPromoCodeSchema.safeParse({
        ...req.body,
        code: req.body.code?.toUpperCase().trim(),
      });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid promo code data", details: parsed.error.flatten() });
      }
      const existing = await storage.getPromoCodeByCode(parsed.data.code);
      if (existing) {
        return res.status(400).json({ error: "A promo code with this code already exists" });
      }
      const promoCode = await storage.createPromoCode(parsed.data);
      res.json({ success: true, promoCode });
    } catch (error: any) {
      console.error("Error creating promo code:", error);
      res.status(500).json({ error: "Failed to create promo code" });
    }
  });

  app.put("/api/admin/promo-codes/:id", verifyAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body };
      if (updates.code) {
        updates.code = updates.code.toUpperCase().trim();
      }
      const promoCode = await storage.updatePromoCode(id, updates);
      if (!promoCode) {
        return res.status(404).json({ error: "Promo code not found" });
      }
      res.json({ success: true, promoCode });
    } catch (error: any) {
      console.error("Error updating promo code:", error);
      res.status(500).json({ error: "Failed to update promo code" });
    }
  });

  app.delete("/api/admin/promo-codes/:id", verifyAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePromoCode(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting promo code:", error);
      res.status(500).json({ error: "Failed to delete promo code" });
    }
  });
}

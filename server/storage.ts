import { type Order, type InsertOrder, orders, type Product, type InsertProduct, products, type AdminUser, type InsertAdminUser, adminUsers, type SiteSetting, type InsertSiteSetting, siteSettings, type Category, type InsertCategory, categories } from "@shared/schema";
import { db } from "./db";
import { sql, eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  updateOrderPayment(orderId: string, paymentIntentId: string, status: string): Promise<Order | undefined>;
  updateOrderStatus(orderId: string, status: string): Promise<Order | undefined>;
  updateOrderNotes(orderId: string, notes: string): Promise<Order | undefined>;
  updateOrderQuote(orderId: string, quotedPrice: number, quoteStatus: string): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  createProduct(product: InsertProduct): Promise<Product>;
  createProductWithId(id: string, product: InsertProduct): Promise<Product>;
  getProduct(id: string): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getAdminByEmail(email: string): Promise<AdminUser | undefined>;
  createAdmin(admin: InsertAdminUser): Promise<AdminUser>;
  getSiteSetting(key: string): Promise<SiteSetting | undefined>;
  getAllSiteSettings(): Promise<SiteSetting[]>;
  upsertSiteSetting(key: string, value: string): Promise<SiteSetting>;
  deleteSiteSetting(key: string): Promise<boolean>;
  createCategory(category: InsertCategory): Promise<Category>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  getActiveCategories(): Promise<Category[]>;
  updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder as any).returning();
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async updateOrderPayment(orderId: string, paymentIntentId: string, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ paymentIntentId, status })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  async updateOrderNotes(orderId: string, notes: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ adminNotes: notes })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  async updateOrderQuote(orderId: string, quotedPrice: number, quoteStatus: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ quotedPrice, quoteStatus })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  async deleteOrder(id: string): Promise<boolean> {
    await db.delete(orders).where(eq(orders.id, id));
    return true;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async createProductWithId(id: string, insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values({ ...insertProduct, id }).returning();
    return product;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(asc(products.sortOrder), desc(products.createdAt));
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return true;
  }

  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return admin;
  }

  async createAdmin(insertAdmin: InsertAdminUser): Promise<AdminUser> {
    const [admin] = await db.insert(adminUsers).values(insertAdmin).returning();
    return admin;
  }

  // Stripe product queries
  async listStripeProducts(active = true, limit = 20, offset = 0) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.products WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching Stripe products:', error);
      return [];
    }
  }

  async listStripeProductsWithPrices(active = true, limit = 20, offset = 0) {
    try {
      const result = await db.execute(
        sql`
          WITH paginated_products AS (
            SELECT id, name, description, metadata, active, images
            FROM stripe.products
            WHERE active = ${active}
            ORDER BY id
            LIMIT ${limit} OFFSET ${offset}
          )
          SELECT 
            p.id as product_id,
            p.name as product_name,
            p.description as product_description,
            p.active as product_active,
            p.metadata as product_metadata,
            p.images as product_images,
            pr.id as price_id,
            pr.unit_amount,
            pr.currency,
            pr.active as price_active
          FROM paginated_products p
          LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
          ORDER BY p.id, pr.unit_amount
        `
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching Stripe products with prices:', error);
      return [];
    }
  }

  async getStripePrice(priceId: string) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching Stripe price:', error);
      return null;
    }
  }

  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async getAllSiteSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings);
  }

  async upsertSiteSetting(key: string, value: string): Promise<SiteSetting> {
    const existing = await this.getSiteSetting(key);
    if (existing) {
      const [updated] = await db.update(siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteSettings.key, key))
        .returning();
      return updated;
    }
    const [created] = await db.insert(siteSettings)
      .values({ key, value })
      .returning();
    return created;
  }

  async deleteSiteSetting(key: string): Promise<boolean> {
    await db.delete(siteSettings).where(eq(siteSettings.key, key));
    return true;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.displayOrder));
  }

  async getActiveCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.active, true)).orderBy(asc(categories.displayOrder));
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();

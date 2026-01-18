import { type Order, type InsertOrder, orders } from "@shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";

export interface IStorage {
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  updateOrderPayment(orderId: string, paymentIntentId: string, status: string): Promise<Order | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values({
      customerName: insertOrder.customerName,
      customerEmail: insertOrder.customerEmail,
      customerPhone: insertOrder.customerPhone,
      deliveryAddress: insertOrder.deliveryAddress,
      specialInstructions: insertOrder.specialInstructions,
      items: insertOrder.items,
      total: insertOrder.total,
    }).returning();
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders);
    return result.find(o => o.id === id);
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async updateOrderPayment(orderId: string, paymentIntentId: string, status: string): Promise<Order | undefined> {
    const result = await db.execute(
      sql`UPDATE orders SET status = ${status} WHERE id = ${orderId} RETURNING *`
    );
    return result.rows[0] as Order | undefined;
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
}

export const storage = new DatabaseStorage();

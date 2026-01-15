import { type Order, type InsertOrder, orders } from "@shared/schema";
import { db, executeWithRetry } from "./db";

export interface IStorage {
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
}

export class DatabaseStorage implements IStorage {
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    return executeWithRetry(async () => {
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
    }, "INSERT order", 3, 1000);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return executeWithRetry(async () => {
      const result = await db.select().from(orders);
      return result.find(o => o.id === id);
    }, "SELECT order by id", 3, 1000);
  }

  async getAllOrders(): Promise<Order[]> {
    return executeWithRetry(async () => {
      return await db.select().from(orders);
    }, "SELECT all orders", 3, 1000);
  }
}

export const storage = new DatabaseStorage();

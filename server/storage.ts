import { type Order, type InsertOrder, orders } from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
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
}

export const storage = new DatabaseStorage();

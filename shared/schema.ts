import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  specialInstructions: text("special_instructions"),
  items: jsonb("items").notNull().$type<Array<{ id: string; name: string; price: number; quantity: number; customNotes?: string }>>(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").default("pickup"),
  paymentIntentId: text("payment_intent_id"),
  pickupDate: timestamp("pickup_date"),
  adminNotes: text("admin_notes"),
  quotedPrice: integer("quoted_price"),
  quoteStatus: text("quote_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  batch: integer("batch").notNull().default(1),
  category: text("category").notNull(),
  image: text("image"),
  isCustom: boolean("is_custom").notNull().default(false),
  trending: boolean("trending").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;

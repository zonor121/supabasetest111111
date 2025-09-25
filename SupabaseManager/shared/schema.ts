import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Generic table metadata for dynamic operations
export const tableMetadata = pgTable("table_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tableName: text("table_name").notNull(),
  columnName: text("column_name").notNull(),
  dataType: text("data_type").notNull(),
  isNullable: boolean("is_nullable").default(true),
  isPrimaryKey: boolean("is_primary_key").default(false),
});

// Example user table - this will be discovered dynamically
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").default("user"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Generic schemas for dynamic table operations
export const dynamicRecordSchema = z.record(z.any());
export type DynamicRecord = z.infer<typeof dynamicRecordSchema>;

export const tableInfoSchema = z.object({
  tableName: z.string(),
  columns: z.array(z.object({
    name: z.string(),
    type: z.string(),
    nullable: z.boolean(),
    primaryKey: z.boolean(),
    defaultValue: z.any().optional(),
  })),
  rowCount: z.number(),
});

export type TableInfo = z.infer<typeof tableInfoSchema>;

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  filters: z.record(z.any()).optional(),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

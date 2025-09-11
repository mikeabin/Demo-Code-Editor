import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  template: text("template").notNull().default("blank"),
  files: jsonb("files").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  template: true,
});

export const updateProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  files: true,
}).partial();

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const fileSchema: z.ZodType<FileNode> = z.object({
  name: z.string(),
  content: z.string().optional(),
  type: z.enum(["file", "folder"]),
  children: z.record(z.lazy(() => fileSchema)).optional(),
});

export type FileNode = {
  name: string;
  content?: string;
  type: "file" | "folder";
  children?: Record<string, FileNode>;
};
export type FileTree = Record<string, FileNode>;

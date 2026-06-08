import { pgTable, text, jsonb, real, boolean, timestamp } from "drizzle-orm/pg-core";

export const workflowConfigsTable = pgTable("workflow_configs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  deptIds: jsonb("dept_ids").notNull(),
  slaMultiplier: real("sla_multiplier").default(1.0),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type WorkflowConfig = typeof workflowConfigsTable.$inferSelect;
export type NewWorkflowConfig = typeof workflowConfigsTable.$inferInsert;

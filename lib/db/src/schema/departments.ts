import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const departmentsTable = pgTable("departments", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  icon: text("icon").notNull(),
  isMandatory: boolean("is_mandatory").notNull().default(true),
  slaHours: integer("sla_hours").notNull().default(24),
  defaultAssignee: text("default_assignee").references(() => usersTable.id),
  sortOrder: integer("sort_order").default(0),
});

export type Department = typeof departmentsTable.$inferSelect;
export type NewDepartment = typeof departmentsTable.$inferInsert;

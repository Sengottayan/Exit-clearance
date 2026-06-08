import { pgTable, text, boolean } from "drizzle-orm/pg-core";
import { clearanceTasksTable } from "./clearance-tasks";

export const checklistItemsTable = pgTable("checklist_items", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => clearanceTasksTable.id),
  label: text("label").notNull(),
  isMandatory: boolean("is_mandatory").notNull().default(true),
  hasInput: boolean("has_input").notNull().default(false),
  inputLabel: text("input_label"),
  checked: boolean("checked").default(false),
  inputValue: text("input_value"),
});

export type ChecklistItem = typeof checklistItemsTable.$inferSelect;
export type NewChecklistItem = typeof checklistItemsTable.$inferInsert;

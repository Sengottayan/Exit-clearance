import { pgTable, text, boolean, integer } from "drizzle-orm/pg-core";
import { departmentsTable } from "./departments";

export const checklistTemplatesTable = pgTable("checklist_templates", {
  id: text("id").primaryKey(),
  deptId: text("dept_id").notNull().references(() => departmentsTable.id),
  label: text("label").notNull(),
  isMandatory: boolean("is_mandatory").notNull().default(true),
  hasInput: boolean("has_input").notNull().default(false),
  inputLabel: text("input_label"),
  sortOrder: integer("sort_order").default(0),
});

export type ChecklistTemplate = typeof checklistTemplatesTable.$inferSelect;
export type NewChecklistTemplate = typeof checklistTemplatesTable.$inferInsert;

import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { exitCasesTable } from "./exit-cases";

export const clearanceTasksTable = pgTable("clearance_tasks", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => exitCasesTable.id),
  deptId: text("dept_id").notNull(),
  deptLabel: text("dept_label").notNull(),
  assigneeId: text("assignee_id").notNull(),
  assigneeName: text("assignee_name").notNull(),
  status: text("status", {
    enum: ["pending", "in_progress", "approved", "rejected", "overdue"],
  }).notNull().default("pending"),
  slaHours: integer("sla_hours").notNull(),
  slaDueAt: timestamp("sla_due_at").notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
});

export type ClearanceTask = typeof clearanceTasksTable.$inferSelect;
export type NewClearanceTask = typeof clearanceTasksTable.$inferInsert;

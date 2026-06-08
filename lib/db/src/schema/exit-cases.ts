import { pgTable, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const exitCasesTable = pgTable("exit_cases", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  employeeName: text("employee_name").notNull(),
  employeeEmail: text("employee_email").notNull(),
  employeeRole: text("employee_role").notNull(),
  employeeDept: text("employee_dept").notNull(),
  managerId: text("manager_id").notNull(),
  managerName: text("manager_name").notNull(),
  status: text("status", {
    enum: ["pending_manager", "in_clearance", "completed", "cancelled"],
  }).notNull().default("pending_manager"),
  resignationDate: timestamp("resignation_date").notNull(),
  lastWorkingDay: timestamp("last_working_day").notNull(),
  noticePeriodDays: integer("notice_period_days").notNull(),
  exitReason: text("exit_reason").notNull(),
  escalated: boolean("escalated").default(false),
  cancelReason: text("cancel_reason"),
  tags: jsonb("tags"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ExitCase = typeof exitCasesTable.$inferSelect;
export type NewExitCase = typeof exitCasesTable.$inferInsert;

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  actor: text("actor").notNull(),
  role: text("role").notNull(),
  type: text("type", {
    enum: ["Case", "Task", "Document", "Comment", "System"],
  }).notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  details: text("details").notNull(),
  caseId: text("case_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;
export type NewAuditLog = typeof auditLogsTable.$inferInsert;

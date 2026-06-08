import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { exitCasesTable } from "./exit-cases";

export const exitInterviewsTable = pgTable("exit_interviews", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().unique().references(() => exitCasesTable.id),
  overallRating: integer("overall_rating").notNull(),
  managementRating: integer("management_rating").notNull(),
  cultureRating: integer("culture_rating").notNull(),
  reason: text("reason").notNull(),
  improvements: text("improvements"),
  wouldRejoin: boolean("would_rejoin").notNull(),
  comments: text("comments"),
  completedAt: timestamp("completed_at"),
});

export type ExitInterview = typeof exitInterviewsTable.$inferSelect;
export type NewExitInterview = typeof exitInterviewsTable.$inferInsert;

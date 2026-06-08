import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { exitCasesTable } from "./exit-cases";

export const timelineEventsTable = pgTable("timeline_events", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => exitCasesTable.id),
  label: text("label").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  actor: text("actor").notNull(),
  actorRole: text("actor_role").notNull(),
  isPending: boolean("is_pending").default(false),
});

export type TimelineEvent = typeof timelineEventsTable.$inferSelect;
export type NewTimelineEvent = typeof timelineEventsTable.$inferInsert;

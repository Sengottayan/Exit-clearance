import { relations } from "drizzle-orm";
import { exitCasesTable } from "./exit-cases";
import { clearanceTasksTable } from "./clearance-tasks";
import { checklistItemsTable } from "./checklist-items";
import { timelineEventsTable } from "./timeline-events";
import { exitInterviewsTable } from "./exit-interviews";
import { documentsTable } from "./documents";
import { notificationsTable } from "./notifications";
import { usersTable } from "./users";
import { departmentsTable } from "./departments";
import { checklistTemplatesTable } from "./checklist-templates";

export const exitCasesRelations = relations(exitCasesTable, ({ many, one }) => ({
  tasks: many(clearanceTasksTable),
  timeline: many(timelineEventsTable),
  exitInterview: one(exitInterviewsTable),
  documents: many(documentsTable),
}));

export const clearanceTasksRelations = relations(clearanceTasksTable, ({ one, many }) => ({
  case: one(exitCasesTable, {
    fields: [clearanceTasksTable.caseId],
    references: [exitCasesTable.id],
  }),
  checklist: many(checklistItemsTable),
}));

export const checklistItemsRelations = relations(checklistItemsTable, ({ one }) => ({
  task: one(clearanceTasksTable, {
    fields: [checklistItemsTable.taskId],
    references: [clearanceTasksTable.id],
  }),
}));

export const timelineEventsRelations = relations(timelineEventsTable, ({ one }) => ({
  case: one(exitCasesTable, {
    fields: [timelineEventsTable.caseId],
    references: [exitCasesTable.id],
  }),
}));

export const exitInterviewsRelations = relations(exitInterviewsTable, ({ one }) => ({
  case: one(exitCasesTable, {
    fields: [exitInterviewsTable.caseId],
    references: [exitCasesTable.id],
  }),
}));

export const documentsRelations = relations(documentsTable, ({ one }) => ({
  case: one(exitCasesTable, {
    fields: [documentsTable.caseId],
    references: [exitCasesTable.id],
  }),
}));

export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [notificationsTable.userId],
    references: [usersTable.id],
  }),
}));

export const departmentsRelations = relations(departmentsTable, ({ many }) => ({
  checklistTemplates: many(checklistTemplatesTable),
}));

export const checklistTemplatesRelations = relations(checklistTemplatesTable, ({ one }) => ({
  department: one(departmentsTable, {
    fields: [checklistTemplatesTable.deptId],
    references: [departmentsTable.id],
  }),
}));

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { exitCasesTable } from "./exit-cases";

export const documentsTable = pgTable("documents", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => exitCasesTable.id),
  docType: text("doc_type", {
    enum: ["resignation_letter", "relieving_letter", "experience_certificate", "attachment"],
  }).notNull(),
  fileName: text("file_name").notNull(),
  uploadedBy: text("uploaded_by"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export type Document = typeof documentsTable.$inferSelect;
export type NewDocument = typeof documentsTable.$inferInsert;

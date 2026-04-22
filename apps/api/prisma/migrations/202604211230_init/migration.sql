CREATE TABLE "Task" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'medium' CHECK ("priority" IN ('low', 'medium', 'high')),
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'in_progress', 'done')),
  "dueDate" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "category" TEXT,
  "parentTaskId" TEXT,
  CONSTRAINT "Task_parentTaskId_fkey"
    FOREIGN KEY ("parentTaskId")
    REFERENCES "Task" ("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX "Task_status_priority_dueDate_idx" ON "Task"("status", "priority", "dueDate");
CREATE INDEX "Task_parentTaskId_idx" ON "Task"("parentTaskId");

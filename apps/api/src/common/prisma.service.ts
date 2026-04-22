import { mkdirSync } from "node:fs";
import path from "node:path";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

const apiRoot = path.resolve(__dirname, "..", "..");
const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

if (databaseUrl.startsWith("file:")) {
  const rawPath = databaseUrl.slice("file:".length);
  const isAbsolute = path.isAbsolute(rawPath) || /^[A-Za-z]:[\\/]/.test(rawPath);
  const resolvedPath = isAbsolute ? rawPath : path.resolve(apiRoot, rawPath);

  mkdirSync(path.dirname(resolvedPath), { recursive: true });
  process.env.DATABASE_URL = `file:${resolvedPath}`;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    await this.$executeRawUnsafe("PRAGMA foreign_keys = ON;");
    await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Task" (
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
    `);
    await this.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "Task_status_priority_dueDate_idx" ON "Task"("status", "priority", "dueDate");'
    );
    await this.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "Task_parentTaskId_idx" ON "Task"("parentTaskId");'
    );
  }
}

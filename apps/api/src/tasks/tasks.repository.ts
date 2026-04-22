import { Inject, Injectable } from "@nestjs/common";
import { Prisma, type Task } from "@prisma/client";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "@intelligent-tasks/shared";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class TasksRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findMany(query: ListTasksQuery) {
    return this.prisma.task.findMany({
      where: this.buildWhere(query),
      include: {
        subTasks: {
          orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }]
        }
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
    });
  }

  async findById(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        subTasks: {
          orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }]
        }
      }
    });
  }

  async findAllFlat() {
    return this.prisma.task.findMany({
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
    });
  }

  async create(input: CreateTaskInput) {
    return this.prisma.task.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        priority: input.priority,
        status: input.status,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        category: input.category ?? null,
        parentTaskId: input.parentTaskId ?? null
      },
      include: { subTasks: true }
    });
  }

  async update(id: string, input: UpdateTaskInput) {
    const data: Prisma.TaskUncheckedUpdateInput = {};

    if (typeof input.title !== "undefined") data.title = input.title;
    if (typeof input.description !== "undefined") data.description = input.description ?? null;
    if (typeof input.priority !== "undefined") data.priority = input.priority;
    if (typeof input.status !== "undefined") data.status = input.status;
    if (typeof input.dueDate !== "undefined") data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    if (typeof input.category !== "undefined") data.category = input.category ?? null;
    if (typeof input.parentTaskId !== "undefined") data.parentTaskId = input.parentTaskId ?? null;

    return this.prisma.task.update({
      where: { id },
      data,
      include: { subTasks: true }
    });
  }

  async delete(id: string) {
    return this.prisma.task.delete({
      where: { id },
      include: { subTasks: true }
    });
  }

  private buildWhere(query: ListTasksQuery): Prisma.TaskWhereInput {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const where: Prisma.TaskWhereInput = {
      parentTaskId: null
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.search) {
      where.OR = [
        {
          title: {
            contains: query.search
          }
        },
        {
          description: {
            contains: query.search
          }
        }
      ];
    }

    if (query.dueState === "overdue") {
      where.dueDate = { lt: startOfToday };
      where.status = query.status ?? { not: "done" };
    }

    if (query.dueState === "today") {
      where.dueDate = {
        gte: startOfToday,
        lte: endOfToday
      };
    }

    if (query.dueState === "upcoming") {
      where.dueDate = {
        gt: endOfToday
      };
    }

    if (query.dueState === "none") {
      where.dueDate = null;
    }

    return where;
  }
}

import type { Task } from "@prisma/client";
import type { TaskDto } from "@intelligent-tasks/shared";

type TaskWithChildren = Task & { subTasks?: Task[] };

export function toTaskDto(task: TaskWithChildren): TaskDto {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    category: task.category,
    parentTaskId: task.parentTaskId,
    subTasks: (task.subTasks ?? []).map((subTask) => ({
      id: subTask.id,
      title: subTask.title,
      description: subTask.description,
      priority: subTask.priority,
      status: subTask.status,
      dueDate: subTask.dueDate ? subTask.dueDate.toISOString() : null,
      createdAt: subTask.createdAt.toISOString(),
      updatedAt: subTask.updatedAt.toISOString(),
      category: subTask.category,
      parentTaskId: subTask.parentTaskId
    }))
  };
}


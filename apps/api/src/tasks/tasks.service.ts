import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "@intelligent-tasks/shared";
import { toTaskDto } from "./task.mapper";
import { TasksRepository } from "./tasks.repository";

@Injectable()
export class TasksService {
  constructor(@Inject(TasksRepository) private readonly tasksRepository: TasksRepository) {}

  async list(query: ListTasksQuery) {
    const tasks = await this.tasksRepository.findMany(query);
    return tasks.map(toTaskDto);
  }

  async getById(id: string) {
    const task = await this.tasksRepository.findById(id);

    if (!task) {
      throw new NotFoundException(`Task ${id} was not found`);
    }

    return toTaskDto(task);
  }

  async getRawById(id: string) {
    const task = await this.tasksRepository.findById(id);

    if (!task) {
      throw new NotFoundException(`Task ${id} was not found`);
    }

    return task;
  }

  async listRaw() {
    return this.tasksRepository.findAllFlat();
  }

  async create(input: CreateTaskInput) {
    const task = await this.tasksRepository.create(input);
    return toTaskDto(task);
  }

  async update(id: string, input: UpdateTaskInput) {
    await this.getRawById(id);
    const task = await this.tasksRepository.update(id, input);
    return toTaskDto(task);
  }

  async delete(id: string) {
    await this.getRawById(id);
    const task = await this.tasksRepository.delete(id);
    return toTaskDto(task);
  }
}

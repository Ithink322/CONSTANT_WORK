import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import {
  CreateTaskInputSchema,
  ListTasksQuerySchema,
  UpdateTaskInputSchema
} from "@intelligent-tasks/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { TasksService } from "./tasks.service";

@Controller({
  path: "tasks",
  version: "1"
})
export class TasksController {
  constructor(@Inject(TasksService) private readonly tasksService: TasksService) {}

  @Get()
  list(@Query(new ZodValidationPipe(ListTasksQuerySchema)) query: unknown) {
    return this.tasksService.list(query as never);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.tasksService.getById(id);
  }

  @Post()
  create(@Body(new ZodValidationPipe(CreateTaskInputSchema)) input: unknown) {
    return this.tasksService.create(input as never);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateTaskInputSchema)) input: unknown
  ) {
    return this.tasksService.update(id, input as never);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tasksService.delete(id);
  }
}

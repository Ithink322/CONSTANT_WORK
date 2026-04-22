import { Module } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { TasksController } from "./tasks.controller";
import { TasksRepository } from "./tasks.repository";
import { TasksService } from "./tasks.service";

@Module({
  controllers: [TasksController],
  providers: [PrismaService, TasksRepository, TasksService],
  exports: [TasksService, PrismaService]
})
export class TasksModule {}

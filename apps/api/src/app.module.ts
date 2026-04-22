import { Module } from "@nestjs/common";
import { AiModule } from "./ai/ai.module";
import { TasksModule } from "./tasks/tasks.module";

@Module({
  imports: [TasksModule, AiModule],
  providers: []
})
export class AppModule {}

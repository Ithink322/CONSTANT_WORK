import { Controller, Inject, Post, Param } from "@nestjs/common";
import { AiService } from "./ai.service";

@Controller({
  path: "tasks",
  version: "1"
})
export class AiController {
  constructor(@Inject(AiService) private readonly aiService: AiService) {}

  @Post(":id/ai/category")
  suggestCategory(@Param("id") id: string) {
    return this.aiService.suggestCategory(id);
  }

  @Post(":id/ai/priority")
  suggestPriority(@Param("id") id: string) {
    return this.aiService.suggestPriority(id);
  }

  @Post(":id/ai/decompose")
  decomposeTask(@Param("id") id: string) {
    return this.aiService.decomposeTask(id);
  }

  @Post("ai/workload-summary")
  summarizeWorkload() {
    return this.aiService.summarizeWorkload();
  }
}

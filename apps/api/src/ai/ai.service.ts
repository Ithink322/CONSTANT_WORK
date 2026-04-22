import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { Task } from "@prisma/client";
import {
  CategorySuggestionSchema,
  DecomposeTaskSchema,
  PrioritySuggestionSchema,
  WorkloadSummarySchema,
  type CategorySuggestion,
  type DecomposeTaskResult,
  type PrioritySuggestion,
  type WorkloadSummary
} from "@intelligent-tasks/shared";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { TasksService } from "../tasks/tasks.service";

@Injectable()
export class AiService {
  private readonly provider = process.env.LLM_PROVIDER ?? (process.env.OPENAI_API_KEY ? "openai" : "heuristic");
  private readonly model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  private readonly client = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

  constructor(@Inject(TasksService) private readonly tasksService: TasksService) {}

  async suggestCategory(taskId: string): Promise<CategorySuggestion> {
    const task = await this.tasksService.getRawById(taskId);
    return this.withFallback(
      () =>
        this.parseStructuredResponse(
          "You categorize tasks into one concise category. Reply only with structured data.",
          `Task title: ${task.title}\nTask description: ${task.description ?? "No description"}`,
          CategorySuggestionSchema,
          "task_category"
        ),
      () => this.heuristicCategory(task)
    );
  }

  async suggestPriority(taskId: string): Promise<PrioritySuggestion> {
    const task = await this.tasksService.getRawById(taskId);
    return this.withFallback(
      () =>
        this.parseStructuredResponse(
          "You assess task urgency and recommend one priority level. Reply only with structured data.",
          `Task title: ${task.title}
Task description: ${task.description ?? "No description"}
Current status: ${task.status}
Due date: ${task.dueDate ? task.dueDate.toISOString() : "None"}`,
          PrioritySuggestionSchema,
          "task_priority"
        ),
      () => this.heuristicPriority(task)
    );
  }

  async decomposeTask(taskId: string): Promise<DecomposeTaskResult> {
    const task = await this.tasksService.getRawById(taskId);
    return this.withFallback(
      () =>
        this.parseStructuredResponse(
          "Break a task into 3-5 concrete subtasks. Keep items practical, short, and implementation-ready. Reply only with structured data.",
          `Task title: ${task.title}
Task description: ${task.description ?? "No description"}
Current due date: ${task.dueDate ? task.dueDate.toISOString() : "None"}`,
          DecomposeTaskSchema,
          "task_decomposition"
        ),
      () => this.heuristicDecompose(task)
    );
  }

  async summarizeWorkload(): Promise<WorkloadSummary> {
    const tasks = await this.tasksService.listRaw();
    const metrics = this.computeMetrics(tasks);
    const nearestDue = tasks
      .filter((task) => task.dueDate)
      .sort((a, b) => Number(a.dueDate) - Number(b.dueDate))
      .slice(0, 5)
      .map((task) => ({
        title: task.title,
        dueDate: task.dueDate?.toISOString(),
        status: task.status,
        priority: task.priority
      }));

    return this.withFallback(
      () =>
        this.parseStructuredResponse(
          "Write a concise workload summary for a productivity app user. Mention risks, deadlines, and where attention should go next. Reply only with structured data.",
          `Metrics: ${JSON.stringify(metrics)}
Nearest due tasks: ${JSON.stringify(nearestDue)}`,
          WorkloadSummarySchema,
          "workload_summary"
        ),
      () => ({
        summary: this.heuristicSummary(metrics),
        metrics
      })
    );
  }

  private async withFallback<T>(primary: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
    if (this.provider === "heuristic") {
      return fallback();
    }

    if (!this.client) {
      throw new ServiceUnavailableException("OPENAI_API_KEY is required when LLM_PROVIDER=openai");
    }

    try {
      return await primary();
    } catch (error) {
      console.warn("Falling back to heuristic AI provider:", error);
      return fallback();
    }
  }

  private async parseStructuredResponse<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: Parameters<typeof zodTextFormat>[0],
    schemaName: string
  ): Promise<T> {
    if (!this.client) {
      throw new ServiceUnavailableException("OpenAI client is not configured");
    }

    const response = await this.client.responses.parse({
      model: this.model,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      text: {
        format: zodTextFormat(schema, schemaName)
      }
    });

    return response.output_parsed as T;
  }

  private heuristicCategory(task: Task): CategorySuggestion {
    const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
    const candidates = [
      { tag: "Planning", words: ["plan", "roadmap", "scope", "estimate"] },
      { tag: "Development", words: ["build", "implement", "api", "frontend", "backend", "code"] },
      { tag: "Research", words: ["research", "investigate", "compare", "study"] },
      { tag: "Meeting", words: ["meeting", "call", "sync", "agenda"] },
      { tag: "Documentation", words: ["doc", "readme", "spec", "write"] },
      { tag: "Personal", words: ["buy", "home", "family", "personal"] }
    ];

    const match = candidates.find((candidate) =>
      candidate.words.some((word) => haystack.includes(word))
    );

    return {
      suggestion: match?.tag ?? "General",
      rationale: match
        ? `Matched the task text to ${match.tag.toLowerCase()}-related keywords.`
        : "No strong domain keywords were found, so a general bucket is the safest default."
    };
  }

  private heuristicPriority(task: Task): PrioritySuggestion {
    const now = new Date();
    const dueDate = task.dueDate;
    const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
    const urgentWords = ["urgent", "asap", "blocker", "production", "incident", "today"];

    if (dueDate) {
      const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours < 0) {
        return {
          suggestion: "high",
          rationale: "The task is already overdue, so it should be treated as high priority."
        };
      }

      if (diffHours <= 48) {
        return {
          suggestion: "high",
          rationale: "The deadline is close, so a high priority helps prevent a miss."
        };
      }

      if (diffHours <= 120) {
        return {
          suggestion: "medium",
          rationale: "The task has a near-term deadline but is not immediately overdue."
        };
      }
    }

    if (urgentWords.some((word) => haystack.includes(word))) {
      return {
        suggestion: "high",
        rationale: "Urgency keywords in the task text suggest it should be handled quickly."
      };
    }

    return {
      suggestion: "medium",
      rationale: "There is no clear urgency signal, so medium is a balanced default."
    };
  }

  private heuristicDecompose(task: Task): DecomposeTaskResult {
    const baseDate = task.dueDate ? new Date(task.dueDate) : null;
    const days = [5, 3, 1];
    const dueDates = days.map((daysBefore) => {
      if (!baseDate) return null;
      const value = new Date(baseDate);
      value.setDate(value.getDate() - daysBefore);
      return value.toISOString();
    });

    return {
      rationale: "The task was split into a simple execution flow: clarify, prepare, do the core work, then review.",
      suggestions: [
        {
          title: `Clarify scope for: ${task.title}`,
          description: "Write down the outcome, constraints, and what done looks like.",
          priority: "medium",
          dueDate: dueDates[0]
        },
        {
          title: `Prepare materials for: ${task.title}`,
          description: "Collect the files, data, links, or requirements needed to execute.",
          priority: "medium",
          dueDate: dueDates[1]
        },
        {
          title: `Complete the core work for: ${task.title}`,
          description: task.description ?? "Execute the main deliverable for this task.",
          priority: task.priority,
          dueDate: dueDates[2] ?? baseDate?.toISOString() ?? null
        },
        {
          title: `Review and finalize: ${task.title}`,
          description: "Do a final pass, fix issues, and confirm the deliverable is ready.",
          priority: "medium",
          dueDate: baseDate?.toISOString() ?? null
        }
      ]
    };
  }

  private computeMetrics(tasks: Task[]) {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const endOfWeek = new Date(endOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return {
      total: tasks.length,
      overdue: tasks.filter((task) => task.dueDate && task.dueDate < startOfToday && task.status !== "done").length,
      dueToday: tasks.filter((task) => task.dueDate && task.dueDate >= startOfToday && task.dueDate <= endOfToday).length,
      dueThisWeek: tasks.filter((task) => task.dueDate && task.dueDate > endOfToday && task.dueDate <= endOfWeek).length,
      pending: tasks.filter((task) => task.status === "pending").length,
      inProgress: tasks.filter((task) => task.status === "in_progress").length,
      done: tasks.filter((task) => task.status === "done").length
    };
  }

  private heuristicSummary(metrics: WorkloadSummary["metrics"]) {
    const pressure =
      metrics.overdue > 0
        ? `You have ${metrics.overdue} overdue task${metrics.overdue > 1 ? "s" : ""}, which should be the first focus.`
        : "You do not have overdue tasks right now.";

    const deadlines =
      metrics.dueToday > 0
        ? `There ${metrics.dueToday === 1 ? "is" : "are"} ${metrics.dueToday} task${metrics.dueToday > 1 ? "s" : ""} due today.`
        : metrics.dueThisWeek > 0
          ? `${metrics.dueThisWeek} task${metrics.dueThisWeek > 1 ? "s are" : " is"} due within the next week.`
          : "Your upcoming deadline pressure looks manageable.";

    return `${pressure} ${deadlines} You currently have ${metrics.inProgress} task${metrics.inProgress !== 1 ? "s" : ""} in progress, ${metrics.pending} pending, and ${metrics.done} done.`;
  }
}

import { z } from "zod";

export const PrioritySchema = z.enum(["low", "medium", "high"]);
export const StatusSchema = z.enum(["pending", "in_progress", "done"]);
export const DueStateSchema = z.enum(["all", "overdue", "today", "upcoming", "none"]);

export type Priority = z.infer<typeof PrioritySchema>;
export type Status = z.infer<typeof StatusSchema>;
export type DueState = z.infer<typeof DueStateSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  priority: PrioritySchema,
  status: StatusSchema,
  dueDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  category: z.string().nullable(),
  parentTaskId: z.string().nullable(),
  subTasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      priority: PrioritySchema,
      status: StatusSchema,
      dueDate: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
      category: z.string().nullable(),
      parentTaskId: z.string().nullable()
    })
  )
});

export type TaskDto = z.infer<typeof TaskSchema>;

export const CreateTaskInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  description: z.string().trim().max(5000, "Description is too long").nullable().optional(),
  priority: PrioritySchema.default("medium"),
  status: StatusSchema.default("pending"),
  dueDate: z.string().datetime().nullable().optional().or(z.literal("")).transform((value) => {
    return value === "" ? null : value ?? null;
  }),
  category: z.string().trim().max(60, "Category is too long").nullable().optional(),
  parentTaskId: z.string().nullable().optional()
});

export const UpdateTaskInputSchema = CreateTaskInputSchema.partial().refine((value) => {
  return Object.keys(value).length > 0;
}, "At least one field must be provided");

export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>;

export const ListTasksQuerySchema = z.object({
  status: StatusSchema.optional(),
  priority: PrioritySchema.optional(),
  dueState: DueStateSchema.optional(),
  search: z.string().trim().max(120).optional()
});

export type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>;

export const CategorySuggestionSchema = z.object({
  suggestion: z.string().trim().min(1).max(60),
  rationale: z.string().trim().min(1).max(240)
});

export const PrioritySuggestionSchema = z.object({
  suggestion: PrioritySchema,
  rationale: z.string().trim().min(1).max(240)
});

export const SubtaskSuggestionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(5000).nullable().optional(),
  priority: PrioritySchema,
  dueDate: z.string().datetime().nullable().optional()
});

export const DecomposeTaskSchema = z.object({
  rationale: z.string().trim().min(1).max(300),
  suggestions: z.array(SubtaskSuggestionSchema).min(1).max(6)
});

export const WorkloadMetricsSchema = z.object({
  total: z.number().int().nonnegative(),
  overdue: z.number().int().nonnegative(),
  dueToday: z.number().int().nonnegative(),
  dueThisWeek: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  inProgress: z.number().int().nonnegative(),
  done: z.number().int().nonnegative()
});

export const WorkloadSummarySchema = z.object({
  summary: z.string().trim().min(1).max(1500),
  metrics: WorkloadMetricsSchema
});

export type CategorySuggestion = z.infer<typeof CategorySuggestionSchema>;
export type PrioritySuggestion = z.infer<typeof PrioritySuggestionSchema>;
export type SubtaskSuggestion = z.infer<typeof SubtaskSuggestionSchema>;
export type DecomposeTaskResult = z.infer<typeof DecomposeTaskSchema>;
export type WorkloadSummary = z.infer<typeof WorkloadSummarySchema>;

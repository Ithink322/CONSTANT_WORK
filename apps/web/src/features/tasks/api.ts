import type {
  CategorySuggestion,
  CreateTaskInput,
  DecomposeTaskResult,
  ListTasksQuery,
  PrioritySuggestion,
  TaskDto,
  UpdateTaskInput,
  WorkloadSummary
} from "@intelligent-tasks/shared";
import { apiRequest } from "../../lib/api";

function buildQuery(params: ListTasksQuery) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const tasksApi = {
  list: (query: ListTasksQuery) =>
    apiRequest<TaskDto[]>(`/tasks${buildQuery(query)}`),
  create: (input: CreateTaskInput) =>
    apiRequest<TaskDto>("/tasks", { method: "POST", body: input }),
  update: (id: string, input: UpdateTaskInput) =>
    apiRequest<TaskDto>(`/tasks/${id}`, { method: "PATCH", body: input }),
  remove: (id: string) =>
    apiRequest<TaskDto>(`/tasks/${id}`, { method: "DELETE" }),
  suggestCategory: (id: string) =>
    apiRequest<CategorySuggestion>(`/tasks/${id}/ai/category`, { method: "POST" }),
  suggestPriority: (id: string) =>
    apiRequest<PrioritySuggestion>(`/tasks/${id}/ai/priority`, { method: "POST" }),
  decompose: (id: string) =>
    apiRequest<DecomposeTaskResult>(`/tasks/${id}/ai/decompose`, { method: "POST" }),
  summarizeWorkload: () =>
    apiRequest<WorkloadSummary>("/tasks/ai/workload-summary", { method: "POST" })
};


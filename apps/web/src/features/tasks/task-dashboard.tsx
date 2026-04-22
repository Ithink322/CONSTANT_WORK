import type {
  CreateTaskInput,
  DecomposeTaskResult,
  ListTasksQuery,
  TaskDto,
  UpdateTaskInput
} from "@intelligent-tasks/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { tasksApi } from "./api";
import { TaskCard } from "./task-card";
import { type TaskFormValues, TaskForm } from "./task-form";

type FiltersState = {
  status: "" | ListTasksQuery["status"];
  priority: "" | ListTasksQuery["priority"];
  dueState: "" | ListTasksQuery["dueState"];
  search: string;
};

const initialFilters: FiltersState = {
  status: "",
  priority: "",
  dueState: "",
  search: ""
};

function normalizeTaskInput(values: TaskFormValues): CreateTaskInput {
  return {
    title: values.title.trim(),
    description: values.description?.trim() || null,
    priority: values.priority,
    status: values.status,
    category: values.category?.trim() || null,
    dueDate: values.dueDate ? new Date(`${values.dueDate}T12:00:00`).toISOString() : null
  };
}

function statsFromTasks(tasks: TaskDto[]) {
  const allTasks = tasks.flatMap((task) => [task, ...task.subTasks]);
  return {
    total: allTasks.length,
    done: allTasks.filter((task) => task.status === "done").length,
    high: allTasks.filter((task) => task.priority === "high").length,
    overdue: allTasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done").length
  };
}

function TaskSkeletonCard() {
  return (
    <article className="task-card skeleton-card" aria-hidden="true">
      <div className="task-card-head">
        <div className="skeleton-block">
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-text" />
        </div>
        <div className="card-actions">
          <div className="skeleton-pill" />
          <div className="skeleton-pill" />
        </div>
      </div>

      <div className="chip-row">
        <div className="skeleton-chip" />
        <div className="skeleton-chip" />
        <div className="skeleton-chip skeleton-chip-wide" />
      </div>

      <div className="task-meta">
        <div className="skeleton-line skeleton-meta" />
        <div className="skeleton-line skeleton-meta" />
      </div>

      <div className="ai-actions">
        <div className="skeleton-pill skeleton-button" />
        <div className="skeleton-pill skeleton-button" />
        <div className="skeleton-pill skeleton-button-wide" />
      </div>
    </article>
  );
}

export function TaskDashboard() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [aiState, setAiState] = useState<Record<string, { busyAction?: string | null; suggestions?: Record<string, unknown> }>>({});
  const [workloadSummary, setWorkloadSummary] = useState<string>("");

  useEffect(() => {
    if (!editingTask) {
      document.body.style.overflow = "";
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditingTask(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editingTask]);

  const deferredSearch = useDeferredValue(filters.search);
  const query = useMemo<ListTasksQuery>(() => {
    return {
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      dueState: filters.dueState || undefined,
      search: deferredSearch.trim() || undefined
    };
  }, [deferredSearch, filters.dueState, filters.priority, filters.status]);

  const tasksQuery = useQuery({
    queryKey: ["tasks", query],
    queryFn: () => tasksApi.list(query)
  });

  const createTaskMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => tasksApi.update(id, input),
    onSuccess: async () => {
      setEditingTask(null);
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const workloadMutation = useMutation({
    mutationFn: () => tasksApi.summarizeWorkload(),
    onSuccess: (data) => {
      setWorkloadSummary(data.summary);
    }
  });

  async function runAiAction<T>(
    task: TaskDto,
    action: "category" | "priority" | "decompose",
    request: () => Promise<T>
  ) {
    setAiState((current) => ({
      ...current,
      [task.id]: {
        ...current[task.id],
        busyAction: action
      }
    }));

    try {
      const result = await request();
      setAiState((current) => ({
        ...current,
        [task.id]: {
          busyAction: null,
          suggestions: {
            ...(current[task.id]?.suggestions ?? {}),
            [action]: result
          }
        }
      }));
    } catch (error) {
      setAiState((current) => ({
        ...current,
        [task.id]: {
          ...current[task.id],
          busyAction: null
        }
      }));
      alert(error instanceof Error ? error.message : "AI request failed");
    }
  }

  const stats = statsFromTasks(tasksQuery.data ?? []);
  const showTasksSkeleton = tasksQuery.isLoading || tasksQuery.isFetching;

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Intelligent task manager</p>
          <h1>Keep your plan visible. Let AI handle the repetitive thinking.</h1>
          <p className="hero-copy">
            Manage tasks, filter workload on the server, and use AI suggestions for category,
            priority, decomposition, and workload summaries.
          </p>
        </div>

        <div className="hero-stats">
          <article>
            <strong>{stats.total}</strong>
            <span>Total items</span>
          </article>
          <article>
            <strong>{stats.done}</strong>
            <span>Completed</span>
          </article>
          <article>
            <strong>{stats.high}</strong>
            <span>High priority</span>
          </article>
          <article>
            <strong>{stats.overdue}</strong>
            <span>Overdue</span>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <TaskForm
          pending={createTaskMutation.isPending}
          onSubmit={async (values) => {
            const input = normalizeTaskInput(values);
            await createTaskMutation.mutateAsync(input);
          }}
        />

        <section className="workspace">
          <div className="toolbar panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Explore tasks</p>
                <h2>Server-side filters and search</h2>
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={() => workloadMutation.mutate()}
                disabled={workloadMutation.isPending}
              >
                {workloadMutation.isPending ? "Summarizing..." : "Summarize workload"}
              </button>
            </div>

            <div className="filters">
              <input
                placeholder="Search title or description"
                value={filters.search}
                onChange={(event) => {
                  const value = event.target.value;
                  setFilters((current) => ({ ...current, search: value }));
                }}
              />
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, status: event.target.value as FiltersState["status"] }))
                }
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
              <select
                value={filters.priority}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    priority: event.target.value as FiltersState["priority"]
                  }))
                }
              >
                <option value="">All priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select
                value={filters.dueState}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    dueState: event.target.value as FiltersState["dueState"]
                  }))
                }
              >
                <option value="">All deadlines</option>
                <option value="overdue">Overdue</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="none">No deadline</option>
              </select>
            </div>

            {workloadSummary ? (
              <section className="workload-box">
                <p className="ai-title">AI workload summary</p>
                <p>{workloadSummary}</p>
              </section>
            ) : null}
          </div>

          {tasksQuery.isError ? (
            <div className="panel empty-state">
              {(tasksQuery.error as Error).message || "Could not load tasks"}
            </div>
          ) : null}
          {!showTasksSkeleton && !tasksQuery.isError && tasksQuery.data?.length === 0 ? (
            <div className="panel empty-state">No tasks match your current filters.</div>
          ) : null}

          <div className="task-list">
            {showTasksSkeleton
              ? Array.from({ length: 6 }, (_, index) => <TaskSkeletonCard key={index} />)
              : tasksQuery.data?.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    busyAction={aiState[task.id]?.busyAction}
                    suggestions={aiState[task.id]?.suggestions as never}
                    onEdit={(nextTask) => setEditingTask(nextTask)}
                    onDelete={(nextTask) => {
                      const confirmed = window.confirm(`Delete "${nextTask.title}"?`);
                      if (confirmed) {
                        deleteTaskMutation.mutate(nextTask.id);
                      }
                    }}
                    onSuggestCategory={(nextTask) =>
                      runAiAction(nextTask, "category", () => tasksApi.suggestCategory(nextTask.id))
                    }
                    onApplyCategory={(nextTask, category) =>
                      updateTaskMutation.mutate({ id: nextTask.id, input: { category } })
                    }
                    onSuggestPriority={(nextTask) =>
                      runAiAction(nextTask, "priority", () => tasksApi.suggestPriority(nextTask.id))
                    }
                    onApplyPriority={(nextTask, priority) =>
                      updateTaskMutation.mutate({ id: nextTask.id, input: { priority } })
                    }
                    onDecompose={(nextTask) =>
                      runAiAction(nextTask, "decompose", () => tasksApi.decompose(nextTask.id))
                    }
                    onCreateSubtasks={async (nextTask, subtasks) => {
                      await Promise.all(
                        subtasks.map((subtask) =>
                          createTaskMutation.mutateAsync({
                            title: subtask.title,
                            description: subtask.description ?? null,
                            priority: subtask.priority,
                            status: "pending",
                            dueDate: subtask.dueDate ?? null,
                            category: nextTask.category,
                            parentTaskId: nextTask.id
                          })
                        )
                      );
                      setAiState((current) => ({
                        ...current,
                        [nextTask.id]: {
                          ...current[nextTask.id],
                          suggestions: {
                            ...current[nextTask.id]?.suggestions,
                            decompose: undefined
                          }
                        }
                      }));
                    }}
                  />
                ))}
          </div>
        </section>
      </section>

      {editingTask ? (
        <div className="modal-overlay" onClick={() => setEditingTask(null)} role="presentation">
          <div
            className="modal-shell"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-task-title"
          >
            <TaskForm
              initialTask={editingTask}
              pending={updateTaskMutation.isPending}
              onCancelEdit={() => setEditingTask(null)}
              onSubmit={async (values) => {
                const input = normalizeTaskInput(values);
                await updateTaskMutation.mutateAsync({ id: editingTask.id, input });
              }}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import type { TaskDto } from "@intelligent-tasks/shared";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "in_progress", "done"]),
  category: z.string().trim().optional(),
  dueDate: z.string().optional()
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

type TaskFormProps = {
  initialTask?: TaskDto | null;
  pending: boolean;
  onCancelEdit?: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
};

const defaultValues: TaskFormValues = {
  title: "",
  description: "",
  priority: "medium",
  status: "pending",
  category: "",
  dueDate: ""
};

function toDateInputValue(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function TaskForm({ initialTask, pending, onCancelEdit, onSubmit }: TaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues
  });

  useEffect(() => {
    if (!initialTask) {
      form.reset(defaultValues);
      return;
    }

    form.reset({
      title: initialTask.title,
      description: initialTask.description ?? "",
      priority: initialTask.priority,
      status: initialTask.status,
      category: initialTask.category ?? "",
      dueDate: toDateInputValue(initialTask.dueDate)
    });
  }, [form, initialTask]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{initialTask ? "Edit task" : "Create task"}</p>
          <h2>{initialTask ? initialTask.title : "Capture a new task"}</h2>
        </div>
        {initialTask ? (
          <button className="ghost-button" type="button" onClick={onCancelEdit}>
            Close
          </button>
        ) : null}
      </div>

      <form
        className="task-form"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
          if (!initialTask) {
            form.reset(defaultValues);
          }
        })}
      >
        <label>
          <span>Title</span>
          <input placeholder="Ship release notes" {...form.register("title")} />
          <small>{form.formState.errors.title?.message}</small>
        </label>

        <label>
          <span>Description</span>
          <textarea
            placeholder="Add context, constraints, or acceptance criteria"
            rows={5}
            {...form.register("description")}
          />
        </label>

        <div className="form-grid">
          <label>
            <span>Priority</span>
            <select {...form.register("priority")}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label>
            <span>Status</span>
            <select {...form.register("status")}>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>
        </div>

        <div className="form-grid form-grid-compact">
          <label>
            <span>Category</span>
            <input placeholder="Optional tag" {...form.register("category")} />
          </label>

          <label className="due-date-label">
            <span>Due date</span>
            <input type="date" {...form.register("dueDate")} />
          </label>
        </div>

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? "Saving..." : initialTask ? "Update task" : "Create task"}
          </button>
          {initialTask ? (
            <button className="ghost-button" type="button" onClick={onCancelEdit}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

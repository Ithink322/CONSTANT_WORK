import type {
  CategorySuggestion,
  DecomposeTaskResult,
  PrioritySuggestion,
  TaskDto
} from "@intelligent-tasks/shared";
import { useEffect, useMemo, useState } from "react";

type SuggestionState = {
  category?: CategorySuggestion;
  priority?: PrioritySuggestion;
  decompose?: DecomposeTaskResult;
};

type TaskCardProps = {
  task: TaskDto;
  busyAction?: string | null;
  suggestions?: SuggestionState;
  onEdit: (task: TaskDto) => void;
  onDelete: (task: TaskDto) => void;
  onSuggestCategory: (task: TaskDto) => void;
  onApplyCategory: (task: TaskDto, category: string) => void;
  onSuggestPriority: (task: TaskDto) => void;
  onApplyPriority: (task: TaskDto, priority: TaskDto["priority"]) => void;
  onDecompose: (task: TaskDto) => void;
  onCreateSubtasks: (task: TaskDto, subtasks: DecomposeTaskResult["suggestions"]) => void;
};

function formatDate(date: string | null) {
  if (!date) return "No deadline";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(date));
}

function statusLabel(status: TaskDto["status"]) {
  return status === "in_progress" ? "In progress" : status === "done" ? "Done" : "Pending";
}

export function TaskCard({
  task,
  busyAction,
  suggestions,
  onEdit,
  onDelete,
  onSuggestCategory,
  onApplyCategory,
  onSuggestPriority,
  onApplyPriority,
  onDecompose,
  onCreateSubtasks
}: TaskCardProps) {
  const [draftSubtasks, setDraftSubtasks] = useState(suggestions?.decompose?.suggestions ?? []);

  useEffect(() => {
    setDraftSubtasks(suggestions?.decompose?.suggestions ?? []);
  }, [suggestions?.decompose]);

  const chips = useMemo(
    () => [
      { label: statusLabel(task.status), tone: `status-${task.status}` },
      { label: task.priority, tone: `priority-${task.priority}` },
      { label: task.category ?? "Uncategorized", tone: "neutral" }
    ],
    [task.category, task.priority, task.status]
  );

  return (
    <article className="task-card">
      <div className="task-card-head">
        <div>
          <h3>{task.title}</h3>
          <p className="muted">{task.description || "No description provided."}</p>
        </div>
        <div className="card-actions">
          <button className="ghost-button" onClick={() => onEdit(task)} type="button">
            Edit
          </button>
          <button className="ghost-button danger" onClick={() => onDelete(task)} type="button">
            Delete
          </button>
        </div>
      </div>

      <div className="chip-row">
        {chips.map((chip) => (
          <span className={`chip ${chip.tone}`} key={`${chip.tone}-${chip.label}`}>
            {chip.label}
          </span>
        ))}
      </div>

      <div className="task-meta">
        <span>Due: {formatDate(task.dueDate)}</span>
        <span>Created: {formatDate(task.createdAt)}</span>
      </div>

      <div className="ai-actions">
        <button
          className="secondary-button"
          onClick={() => onSuggestCategory(task)}
          type="button"
          disabled={busyAction === "category"}
        >
          {busyAction === "category" ? "Thinking..." : "Suggest category"}
        </button>
        <button
          className="secondary-button"
          onClick={() => onSuggestPriority(task)}
          type="button"
          disabled={busyAction === "priority"}
        >
          {busyAction === "priority" ? "Thinking..." : "Suggest priority"}
        </button>
        <button
          className="secondary-button"
          onClick={() => onDecompose(task)}
          type="button"
          disabled={busyAction === "decompose"}
        >
          {busyAction === "decompose" ? "Thinking..." : "Break into subtasks"}
        </button>
      </div>

      {suggestions?.category ? (
        <section className="ai-result">
          <p className="ai-title">Suggested category</p>
          <strong>{suggestions.category.suggestion}</strong>
          <p>{suggestions.category.rationale}</p>
          <button
            className="ghost-button"
            type="button"
            onClick={() => onApplyCategory(task, suggestions.category!.suggestion)}
          >
            Apply category
          </button>
        </section>
      ) : null}

      {suggestions?.priority ? (
        <section className="ai-result">
          <p className="ai-title">Suggested priority</p>
          <strong>{suggestions.priority.suggestion}</strong>
          <p>{suggestions.priority.rationale}</p>
          <button
            className="ghost-button"
            type="button"
            onClick={() => onApplyPriority(task, suggestions.priority!.suggestion)}
          >
            Apply priority
          </button>
        </section>
      ) : null}

      {suggestions?.decompose ? (
        <section className="ai-result">
          <p className="ai-title">Suggested subtasks</p>
          <p>{suggestions.decompose.rationale}</p>
          <div className="subtask-drafts">
            {draftSubtasks.map((subtask, index) => (
              <div className="subtask-draft" key={`${task.id}-${index}`}>
                <input
                  value={subtask.title}
                  onChange={(event) => {
                    const next = [...draftSubtasks];
                    next[index] = { ...next[index], title: event.target.value };
                    setDraftSubtasks(next);
                  }}
                />
                <textarea
                  rows={2}
                  value={subtask.description ?? ""}
                  onChange={(event) => {
                    const next = [...draftSubtasks];
                    next[index] = { ...next[index], description: event.target.value || null };
                    setDraftSubtasks(next);
                  }}
                />
              </div>
            ))}
          </div>
          <button className="ghost-button" type="button" onClick={() => onCreateSubtasks(task, draftSubtasks)}>
            Create subtasks
          </button>
        </section>
      ) : null}

      {task.subTasks.length ? (
        <section className="subtasks">
          <p className="ai-title">Subtasks</p>
          <ul>
            {task.subTasks.map((subTask) => (
              <li key={subTask.id}>
                <strong>{subTask.title}</strong>
                <span>{statusLabel(subTask.status)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

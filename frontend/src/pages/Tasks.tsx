import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../auth/useAuth";
import { api } from "../services/api";
import { getCache, setCache } from "../services/cache";

type Project = {
  id: string;
  name: string;
  client_id?: string;
};

type Label = {
  id: string;
  name: string;
  color: string;
  created_by?: string | null;
  created_at?: string | null;
};

type Task = {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  position: number;
  assignee_id?: string | null;
  due_date?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  labels?: Label[];
  checklist_total?: number;
  checklist_done?: number;
};

type ChecklistItem = {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  position: number;
  assignee_id?: string | null;
  due_date?: string | null;
  created_by: string;
  created_at?: string | null;
  updated_at?: string | null;
  completed_at?: string | null;
};

type TaskComment = {
  id: string;
  task_id: string;
  body: string;
  created_by: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type ActivityLogEntry = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  performed_by?: string | null;
  performed_at?: string | null;
};

type ActionLog = {
  id: string;
  taskTitle: string;
  from: string;
  to: string;
  status: "saving" | "saved" | "failed";
  timestamp: string;
};

const projectsCacheKey = "projects:list";
const tasksCacheKey = "tasks:list";
const labelsCacheKey = "labels:list";
const taskStatusesCacheKey = "metadata:task-statuses";
const taskPrioritiesCacheKey = "metadata:task-priorities";
const labelPalette = ["violet", "cyan", "green", "amber", "red", "magenta"];

function getTaskStatusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("done") || normalized.includes("complete") || normalized.includes("conclu")) {
    return "status-done";
  }

  if (normalized.includes("blocked") || normalized.includes("overdue") || normalized.includes("atras")) {
    return "status-blocked";
  }

  if (normalized.includes("review") || normalized.includes("validation")) {
    return "status-review";
  }

  if (normalized.includes("progress") || normalized.includes("doing") || normalized.includes("active")) {
    return "status-progress";
  }

  if (normalized.includes("cancel")) {
    return "status-cancelled";
  }

  return "status-backlog";
}

function getPriorityClass(priority: string) {
  const normalized = priority.toLowerCase();

  if (normalized.includes("urgent")) return "priority-urgent";
  if (normalized.includes("high")) return "priority-high";
  if (normalized.includes("medium")) return "priority-medium";
  if (normalized.includes("low")) return "priority-low";

  return "status-backlog";
}

function formatDate(value?: string | null) {
  if (!value) return "não informado";

  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

function formatDateTime(value?: string | null) {
  if (!value) return "agora";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function getActivityLabel(action: string) {
  const labels: Record<string, string> = {
    created: "Tarefa criada",
    updated: "Tarefa atualizada",
    moved: "Tarefa movida",
    comment_created: "Comentário criado",
    comment_updated: "Comentário editado",
    comment_deleted: "Comentário removido",
    checklist_item_created: "Checklist criado",
    checklist_item_updated: "Checklist atualizado",
    checklist_item_completed: "Checklist concluído",
    checklist_item_reopened: "Checklist reaberto",
    checklist_item_deleted: "Checklist removido",
  };

  return labels[action] || action.replaceAll("_", " ");
}

function formatActivityValue(value?: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) return "";

  return Object.entries(value)
    .map(([key, entryValue]) => `${key}: ${String(entryValue ?? "vazio")}`)
    .join(" · ");
}

export function Tasks() {
  const { currentUser } = useAuth();
  const actionLogCounter = useRef(0);
  const cachedProjects = getCache<Project[]>(projectsCacheKey);
  const cachedTasks = getCache<Task[]>(tasksCacheKey);
  const cachedLabels = getCache<Label[]>(labelsCacheKey);
  const cachedTaskStatuses = getCache<string[]>(taskStatusesCacheKey);
  const cachedTaskPriorities = getCache<string[]>(taskPrioritiesCacheKey);
  const [projects, setProjects] = useState<Project[]>(() => cachedProjects ?? []);
  const [tasks, setTasks] = useState<Task[]>(() => cachedTasks ?? []);
  const [labels, setLabels] = useState<Label[]>(() => cachedLabels ?? []);
  const [statuses, setStatuses] = useState<string[]>(() => cachedTaskStatuses ?? []);
  const [priorities, setPriorities] = useState<string[]>(() => cachedTaskPriorities ?? []);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(() => cachedTaskPriorities?.[1] ?? cachedTaskPriorities?.[0] ?? "");
  const [dueDate, setDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(() => !cachedTasks);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState("");
  const [draggingOverColumn, setDraggingOverColumn] = useState("");
  const [savingTaskId, setSavingTaskId] = useState("");
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [error, setError] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [taskChecklist, setTaskChecklist] = useState<ChecklistItem[]>([]);
  const [taskActivity, setTaskActivity] = useState<ActivityLogEntry[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDetailSaving, setIsDetailSaving] = useState(false);
  const [isCommentSaving, setIsCommentSaving] = useState(false);
  const [isChecklistSaving, setIsChecklistSaving] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailTitle, setDetailTitle] = useState("");
  const [detailDescription, setDetailDescription] = useState("");
  const [detailStatus, setDetailStatus] = useState("");
  const [detailPriority, setDetailPriority] = useState("");
  const [detailDueDate, setDetailDueDate] = useState("");
  const [newCommentBody, setNewCommentBody] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingCommentBody, setEditingCommentBody] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [editingChecklistId, setEditingChecklistId] = useState("");
  const [editingChecklistTitle, setEditingChecklistTitle] = useState("");
  const [editingChecklistDueDate, setEditingChecklistDueDate] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [debouncedFilterSearch, setDebouncedFilterSearch] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterLabelId, setFilterLabelId] = useState("");
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [filterOnlyMine, setFilterOnlyMine] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(labelPalette[0]);
  const [isLabelSaving, setIsLabelSaving] = useState(false);
  const canManageTasks = ["ADMIN", "MANAGER", "ANALYST"].includes(currentUser?.role || "");

  const hasActiveFilters = Boolean(
    filterSearch.trim()
      || filterProjectId
      || filterStatus
      || filterPriority
      || filterLabelId
      || filterOverdue
      || filterOnlyMine,
  );

  // Debounce search: update debouncedFilterSearch 300ms after the last keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilterSearch(filterSearch), 300);
    return () => clearTimeout(timer);
  }, [filterSearch]);

  const getTaskFilterParams = useCallback(() => ({
    project_id: filterProjectId || undefined,
    status: filterStatus || undefined,
    priority: filterPriority || undefined,
    label_id: filterLabelId || undefined,
    overdue: filterOverdue || undefined,
    search: debouncedFilterSearch.trim() || undefined,
    only_mine: filterOnlyMine || undefined,
  }), [filterProjectId, filterStatus, filterPriority, filterLabelId, filterOverdue, debouncedFilterSearch, filterOnlyMine]);

  async function fetchData() {
    setError("");

    try {
      const [projectsRes, tasksRes, labelsRes, statusesRes, prioritiesRes] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks", { params: getTaskFilterParams() }),
        api.get("/labels"),
        api.get("/metadata/task-statuses"),
        api.get("/metadata/task-priorities"),
      ]);

      setCache(projectsCacheKey, projectsRes.data);
      if (!hasActiveFilters) {
        setCache(tasksCacheKey, tasksRes.data);
      }
      setCache(labelsCacheKey, labelsRes.data);
      setCache(taskStatusesCacheKey, statusesRes.data);
      setCache(taskPrioritiesCacheKey, prioritiesRes.data);
      setProjects(projectsRes.data);
      setTasks(tasksRes.data);
      setLabels(labelsRes.data);
      setStatuses(statusesRes.data);
      setPriorities(prioritiesRes.data);
      setPriority((currentPriority) => currentPriority || prioritiesRes.data[1] || prioritiesRes.data[0] || "MEDIUM");
    } catch {
      setError("Não foi possível carregar as tarefas. Verifique se o backend está ativo.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  async function createTask() {
    if (!projectId || !title.trim() || !priority) return;

    setError("");
    setIsSaving(true);

    try {
      await api.post("/tasks", {
        project_id: projectId,
        title,
        description: description || null,
        priority: priority || priorities[0] || "MEDIUM",
        due_date: dueDate || null,
      });

      setProjectId("");
      setTitle("");
      setDescription("");
      setDueDate("");
      await fetchData();
    } catch {
      setError("Não foi possível criar a tarefa.");
    } finally {
      setIsSaving(false);
    }
  }

  function getProjectName(task: Task) {
    if (!task.project_id) {
      return task.description || "Sem descrição informada";
    }

    return projects.find((project) => project.id === task.project_id)?.name || "Projeto não encontrado";
  }

  function syncDetailForm(task: Task) {
    setDetailTitle(task.title);
    setDetailDescription(task.description || "");
    setDetailStatus(task.status);
    setDetailPriority(task.priority);
    setDetailDueDate(getDateInputValue(task.due_date));
  }

  function updateTaskInState(updatedTask: Task) {
    setTasks((currentTasks) => {
      const nextTasks = currentTasks.map((task) =>
        task.id === updatedTask.id ? { ...task, ...updatedTask } : task,
      );
      setCache(tasksCacheKey, nextTasks);
      return nextTasks;
    });
  }

  function clearFilters() {
    setFilterSearch("");
    setFilterProjectId("");
    setFilterStatus("");
    setFilterPriority("");
    setFilterLabelId("");
    setFilterOverdue(false);
    setFilterOnlyMine(false);
  }

  function getLabelName(labelId: string) {
    return labels.find((label) => label.id === labelId)?.name || "Label";
  }

  function getSelectedTaskLabelIds() {
    return new Set((selectedTask?.labels || []).map((label) => label.id));
  }

  function getChecklistStats(items: ChecklistItem[]) {
    const total = items.length;
    const done = items.filter((item) => item.is_done).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, done, percent };
  }

  function getTaskChecklistStats(task: Task) {
    const total = task.checklist_total || 0;
    const done = task.checklist_done || 0;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, done, percent };
  }

  async function attachLabel(labelId: string) {
    if (!selectedTask || !canManageTasks || !labelId) return;

    setDetailError("");
    setIsLabelSaving(true);

    try {
      const response = await api.post(`/tasks/${selectedTask.id}/labels`, {
        label_id: labelId,
      });
      setSelectedTask(response.data);
      updateTaskInState(response.data);
      await refreshTaskActivity(selectedTask.id);
      await fetchData();
    } catch {
      setDetailError("Não foi possível vincular a label.");
    } finally {
      setIsLabelSaving(false);
    }
  }

  async function detachLabel(labelId: string) {
    if (!selectedTask || !canManageTasks || !labelId) return;

    setDetailError("");
    setIsLabelSaving(true);

    try {
      const response = await api.delete(`/tasks/${selectedTask.id}/labels/${labelId}`);
      setSelectedTask(response.data);
      updateTaskInState(response.data);
      await refreshTaskActivity(selectedTask.id);
      await fetchData();
    } catch {
      setDetailError("Não foi possível remover a label.");
    } finally {
      setIsLabelSaving(false);
    }
  }

  async function createAndAttachLabel() {
    if (!selectedTask || !canManageTasks || !newLabelName.trim()) return;

    setDetailError("");
    setIsLabelSaving(true);

    try {
      const labelResponse = await api.post("/labels", {
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      const nextLabels = [...labels, labelResponse.data].sort((a, b) => a.name.localeCompare(b.name));
      setLabels(nextLabels);
      setCache(labelsCacheKey, nextLabels);

      const taskResponse = await api.post(`/tasks/${selectedTask.id}/labels`, {
        label_id: labelResponse.data.id,
      });
      setSelectedTask(taskResponse.data);
      updateTaskInState(taskResponse.data);
      setNewLabelName("");
      setNewLabelColor(labelPalette[0]);
      await refreshTaskActivity(selectedTask.id);
      await fetchData();
    } catch {
      setDetailError("Não foi possível criar a label.");
    } finally {
      setIsLabelSaving(false);
    }
  }

  async function refreshChecklist(taskId: string) {
    const checklistRes = await api.get(`/tasks/${taskId}/checklist`);
    setTaskChecklist(checklistRes.data);
  }

  async function createChecklistItem() {
    if (!selectedTask || !canManageTasks || !newChecklistTitle.trim()) return;

    setDetailError("");
    setIsChecklistSaving(true);

    try {
      const response = await api.post(`/tasks/${selectedTask.id}/checklist`, {
        title: newChecklistTitle.trim(),
      });
      setTaskChecklist((currentItems) => [...currentItems, response.data]);
      setNewChecklistTitle("");
      await refreshTaskActivity(selectedTask.id);
      await fetchData();
    } catch {
      setDetailError("Não foi possível criar o item de checklist.");
    } finally {
      setIsChecklistSaving(false);
    }
  }

  function startEditingChecklistItem(item: ChecklistItem) {
    setEditingChecklistId(item.id);
    setEditingChecklistTitle(item.title);
    setEditingChecklistDueDate(getDateInputValue(item.due_date));
  }

  async function updateChecklistItem(itemId: string, payload: Partial<Pick<ChecklistItem, "title" | "is_done" | "position" | "assignee_id" | "due_date">>) {
    if (!selectedTask || !canManageTasks) return;

    setDetailError("");
    setIsChecklistSaving(true);

    try {
      const response = await api.patch(`/checklist-items/${itemId}`, payload);
      setTaskChecklist((currentItems) =>
        currentItems
          .map((item) => (item.id === itemId ? response.data : item))
          .sort((a, b) => a.position - b.position),
      );
      await refreshChecklist(selectedTask.id);
      await refreshTaskActivity(selectedTask.id);
      await fetchData();
    } catch {
      setDetailError("Não foi possível atualizar o checklist.");
    } finally {
      setIsChecklistSaving(false);
    }
  }

  async function saveChecklistEdit(itemId: string) {
    if (!editingChecklistTitle.trim()) return;

    await updateChecklistItem(itemId, {
      title: editingChecklistTitle.trim(),
      due_date: editingChecklistDueDate || null,
    });
    setEditingChecklistId("");
    setEditingChecklistTitle("");
    setEditingChecklistDueDate("");
  }

  async function deleteChecklistItem(itemId: string) {
    if (!selectedTask || !canManageTasks) return;

    setDetailError("");
    setIsChecklistSaving(true);

    try {
      await api.delete(`/checklist-items/${itemId}`);
      setTaskChecklist((currentItems) => currentItems.filter((item) => item.id !== itemId));
      await refreshChecklist(selectedTask.id);
      await refreshTaskActivity(selectedTask.id);
      await fetchData();
    } catch {
      setDetailError("Não foi possível remover o item de checklist.");
    } finally {
      setIsChecklistSaving(false);
    }
  }

  async function loadTaskDetail(taskId: string, initialTask?: Task) {
    setDetailError("");
    setIsDetailLoading(true);

    if (initialTask) {
      setSelectedTask(initialTask);
      syncDetailForm(initialTask);
    }

    try {
      const [taskRes, commentsRes, checklistRes, activityRes] = await Promise.all([
        api.get(`/tasks/${taskId}`),
        api.get(`/tasks/${taskId}/comments`),
        api.get(`/tasks/${taskId}/checklist`),
        api.get(`/tasks/${taskId}/activity`),
      ]);

      setSelectedTask(taskRes.data);
      syncDetailForm(taskRes.data);
      setTaskComments(commentsRes.data);
      setTaskChecklist(checklistRes.data);
      setTaskActivity(activityRes.data);
      updateTaskInState(taskRes.data);
    } catch {
      setDetailError("Não foi possível carregar o detalhe da tarefa.");
    } finally {
      setIsDetailLoading(false);
    }
  }

  function openTaskDetail(task: Task) {
    setSelectedTaskId(task.id);
    setTaskComments([]);
    setTaskChecklist([]);
    setTaskActivity([]);
    setNewCommentBody("");
    setEditingCommentId("");
    setEditingCommentBody("");
    setNewChecklistTitle("");
    setEditingChecklistId("");
    setEditingChecklistTitle("");
    setEditingChecklistDueDate("");
    loadTaskDetail(task.id, task);
  }

  function closeTaskDetail() {
    setSelectedTaskId("");
    setSelectedTask(null);
    setTaskComments([]);
    setTaskChecklist([]);
    setTaskActivity([]);
    setDetailError("");
    setNewCommentBody("");
    setEditingCommentId("");
    setEditingCommentBody("");
    setNewChecklistTitle("");
    setEditingChecklistId("");
    setEditingChecklistTitle("");
    setEditingChecklistDueDate("");
  }

  async function refreshTaskActivity(taskId: string) {
    const activityRes = await api.get(`/tasks/${taskId}/activity`);
    setTaskActivity(activityRes.data);
  }

  async function saveTaskDetail() {
    if (!selectedTask || !canManageTasks || !detailTitle.trim() || !detailStatus || !detailPriority) return;

    setDetailError("");
    setIsDetailSaving(true);

    try {
      const response = await api.patch(`/tasks/${selectedTask.id}`, {
        title: detailTitle.trim(),
        description: detailDescription.trim() || null,
        status: detailStatus,
        priority: detailPriority,
        due_date: detailDueDate || null,
      });

      setSelectedTask(response.data);
      syncDetailForm(response.data);
      updateTaskInState(response.data);
      await refreshTaskActivity(selectedTask.id);
    } catch {
      setDetailError("Não foi possível salvar o detalhe da tarefa.");
    } finally {
      setIsDetailSaving(false);
    }
  }

  async function createTaskComment() {
    if (!selectedTask || !canManageTasks || !newCommentBody.trim()) return;

    setDetailError("");
    setIsCommentSaving(true);

    try {
      const response = await api.post(`/tasks/${selectedTask.id}/comments`, {
        body: newCommentBody.trim(),
      });

      setTaskComments((currentComments) => [...currentComments, response.data]);
      setNewCommentBody("");
      await refreshTaskActivity(selectedTask.id);
    } catch {
      setDetailError("Não foi possível adicionar o comentário.");
    } finally {
      setIsCommentSaving(false);
    }
  }

  function startEditingComment(comment: TaskComment) {
    setEditingCommentId(comment.id);
    setEditingCommentBody(comment.body);
  }

  async function saveCommentEdit(commentId: string) {
    if (!selectedTask || !canManageTasks || !editingCommentBody.trim()) return;

    setDetailError("");
    setIsCommentSaving(true);

    try {
      const response = await api.patch(`/comments/${commentId}`, {
        body: editingCommentBody.trim(),
      });

      setTaskComments((currentComments) =>
        currentComments.map((comment) =>
          comment.id === commentId ? response.data : comment,
        ),
      );
      setEditingCommentId("");
      setEditingCommentBody("");
      await refreshTaskActivity(selectedTask.id);
    } catch {
      setDetailError("Não foi possível editar o comentário.");
    } finally {
      setIsCommentSaving(false);
    }
  }

  async function deleteTaskComment(commentId: string) {
    if (!selectedTask || !canManageTasks) return;

    setDetailError("");
    setIsCommentSaving(true);

    try {
      await api.delete(`/comments/${commentId}`);
      setTaskComments((currentComments) =>
        currentComments.filter((comment) => comment.id !== commentId),
      );
      await refreshTaskActivity(selectedTask.id);
    } catch {
      setDetailError("Não foi possível remover o comentário.");
    } finally {
      setIsCommentSaving(false);
    }
  }

  function getTasksByStatus(taskStatus: string) {
    return tasks
      .filter((task) => task.status === taskStatus)
      .sort((a, b) => a.position - b.position);
  }

  function addActionLog(log: Omit<ActionLog, "id" | "timestamp">) {
    actionLogCounter.current += 1;
    const id = `${actionLogCounter.current}-${log.taskTitle}-${log.to}`;

    setActionLogs((currentLogs) => [
      {
        ...log,
        id,
        timestamp: "agora",
      },
      ...currentLogs,
    ].slice(0, 6));

    return id;
  }

  function updateActionLog(logId: string, status: ActionLog["status"]) {
    setActionLogs((currentLogs) =>
      currentLogs.map((log) =>
        log.id === logId ? { ...log, status, timestamp: "agora" } : log,
      ),
    );
  }

  function getNextTasksAfterMove(taskId: string, nextStatus: string, nextPosition: number) {
    const movingTask = tasks.find((task) => task.id === taskId);

    if (!movingTask) return tasks;

    const sourceStatus = movingTask.status;
    const sourceTasks = tasks
      .filter((task) => task.status === sourceStatus && task.id !== taskId)
      .sort((a, b) => a.position - b.position)
      .map((task, index) => ({ ...task, position: index }));

    const destinationTasks = tasks
      .filter((task) => task.status === nextStatus && task.id !== taskId)
      .sort((a, b) => a.position - b.position);

    const boundedPosition = Math.max(0, Math.min(nextPosition, destinationTasks.length));
    const movedTask = { ...movingTask, status: nextStatus, position: boundedPosition };
    const orderedDestinationTasks = [
      ...destinationTasks.slice(0, boundedPosition),
      movedTask,
      ...destinationTasks.slice(boundedPosition),
    ].map((task, index) => ({ ...task, position: index }));

    if (sourceStatus === nextStatus) {
      return tasks.map((task) =>
        task.status === nextStatus
          ? orderedDestinationTasks.find((destinationTask) => destinationTask.id === task.id) ?? task
          : task,
      );
    }

    return tasks.map((task) => {
      if (task.status === sourceStatus && task.id !== taskId) {
        return sourceTasks.find((sourceTask) => sourceTask.id === task.id) ?? task;
      }

      if (task.status === nextStatus || task.id === taskId) {
        return orderedDestinationTasks.find((destinationTask) => destinationTask.id === task.id) ?? task;
      }

      return task;
    });
  }

  async function moveTask(taskId: string, nextStatus: string, nextPosition: number) {
    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!task || savingTaskId) return;

    const previousStatus = task.status;
    const previousPosition = task.position;
    const previousTasks = tasks;
    const nextTasks = getNextTasksAfterMove(taskId, nextStatus, nextPosition);
    const movedTask = nextTasks.find((currentTask) => currentTask.id === taskId);

    if (!movedTask || (previousStatus === movedTask.status && previousPosition === movedTask.position)) {
      return;
    }

    setError("");
    setSavingTaskId(taskId);
    setCache(tasksCacheKey, nextTasks);
    setTasks(nextTasks);

    const logId = addActionLog({
      taskTitle: task.title,
      from: `${previousStatus} #${previousPosition + 1}`,
      to: `${movedTask.status} #${movedTask.position + 1}`,
      status: "saving",
    });

    try {
      const response = await api.patch(`/tasks/${taskId}/move`, {
        status: movedTask.status,
        position: movedTask.position,
      });
      setTasks((currentTasks) =>
        {
          const updatedTasks = currentTasks.map((currentTask) =>
            currentTask.id === taskId ? { ...currentTask, ...response.data } : currentTask,
          );
          setCache(tasksCacheKey, updatedTasks);
          return updatedTasks;
        },
      );
      updateActionLog(logId, "saved");
    } catch {
      setCache(tasksCacheKey, previousTasks);
      setTasks(previousTasks);
      setError("Não foi possível salvar a mudança de status. A tarefa voltou ao estado anterior.");
      updateActionLog(logId, "failed");
    } finally {
      setSavingTaskId("");
      setDraggingTaskId("");
    }
  }

  useEffect(() => {
    let isMounted = true;

    fetchData().finally(() => {
      if (!isMounted) return;
    });

    return () => {
      isMounted = false;
    };
  }, [debouncedFilterSearch, filterProjectId, filterStatus, filterPriority, filterLabelId, filterOverdue, filterOnlyMine]);

  return (
    <section className="content">
      <header className="page-header">
        <p className="eyebrow">Donnée OS</p>
        <h1>Tarefas</h1>
        <p>Execução diária dos projetos, com prioridade e estado operacional.</p>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <div className="panel panel-spaced">
        <h2>Nova tarefa</h2>

        <div className="form-row">
          <label className="field">
            <span>Projeto</span>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Selecione um projeto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Título</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Mapear indicadores atuais"
            />
          </label>

          <label className="field">
            <span>Prioridade</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {priorities.map((taskPriority) => (
                <option key={taskPriority} value={taskPriority}>
                  {taskPriority}
                </option>
              ))}
            </select>
          </label>

          <button disabled={isSaving || !projectId || !title.trim() || !priority} onClick={createTask}>
            {isSaving ? "Criando..." : "Criar tarefa"}
          </button>
        </div>

        <div className="form-row form-row-secondary">
          <label className="field">
            <span>Descrição curta</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhe a próxima ação"
            />
          </label>

          <label className="field">
            <span>Prazo</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Tarefas cadastradas</h2>
            <p className="row-detail">Arraste uma tarefa para outra coluna. A alteração é salva automaticamente.</p>
          </div>
          <span>
            {savingTaskId
              ? "Salvando mudança..."
              : isRefreshing
                ? "Atualizando..."
              : `${statuses.length} status disponíveis`}
          </span>
        </div>

        <div className="kanban-filter-toolbar" aria-label="Filtros do Kanban">
          <label className="field filter-search">
            <span>Busca</span>
            <input
              value={filterSearch}
              onChange={(event) => setFilterSearch(event.target.value)}
              placeholder="Título ou descrição"
            />
          </label>

          <label className="field">
            <span>Projeto</span>
            <select value={filterProjectId} onChange={(event) => setFilterProjectId(event.target.value)}>
              <option value="">Todos</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Status</span>
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
              <option value="">Todos</option>
              {statuses.map((availableStatus) => (
                <option key={availableStatus} value={availableStatus}>
                  {availableStatus}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Prioridade</span>
            <select value={filterPriority} onChange={(event) => setFilterPriority(event.target.value)}>
              <option value="">Todas</option>
              {priorities.map((availablePriority) => (
                <option key={availablePriority} value={availablePriority}>
                  {availablePriority}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Label</span>
            <select value={filterLabelId} onChange={(event) => setFilterLabelId(event.target.value)}>
              <option value="">Todas</option>
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </label>

          <label className="toggle-field">
            <input
              checked={filterOverdue}
              onChange={(event) => setFilterOverdue(event.target.checked)}
              type="checkbox"
            />
            <span>Atrasadas</span>
          </label>

          <label className="toggle-field">
            <input
              checked={filterOnlyMine}
              onChange={(event) => setFilterOnlyMine(event.target.checked)}
              type="checkbox"
            />
            <span>Minhas</span>
          </label>

          <button className="ghost-action" disabled={!hasActiveFilters} onClick={clearFilters} type="button">
            Limpar filtros
          </button>
        </div>

        {hasActiveFilters && (
          <div className="active-filter-list" aria-label="Filtros ativos">
            {filterSearch.trim() && <span className="meta-chip">Busca: {filterSearch.trim()}</span>}
            {filterProjectId && <span className="meta-chip">Projeto: {projects.find((project) => project.id === filterProjectId)?.name || "selecionado"}</span>}
            {filterStatus && <span className="meta-chip">Status: {filterStatus}</span>}
            {filterPriority && <span className="meta-chip">Prioridade: {filterPriority}</span>}
            {filterLabelId && <span className="meta-chip">Label: {getLabelName(filterLabelId)}</span>}
            {filterOverdue && <span className="meta-chip">Atrasadas</span>}
            {filterOnlyMine && <span className="meta-chip">Minhas tarefas</span>}
          </div>
        )}

        {isLoading ? (
          <p className="muted" aria-live="polite">Carregando tarefas...</p>
        ) : tasks.length === 0 ? (
          <p className="empty-state">
            {hasActiveFilters ? "Nenhuma tarefa combina com os filtros ativos." : "Nenhuma tarefa cadastrada ainda."}
          </p>
        ) : (
          <div className="task-workspace">
            <div className="kanban-board">
              {(statuses.length > 0 ? statuses : Array.from(new Set(tasks.map((task) => task.status)))).map((taskStatus) => {
                const columnTasks = getTasksByStatus(taskStatus);
                const isDropTarget = Boolean(draggingTaskId);

                return (
                  <section
                    className={`kanban-column ${isDropTarget ? "kanban-column-target" : ""} ${draggingOverColumn === taskStatus ? "kanban-column-hover" : ""}`}
                    key={taskStatus}
                    onDragOver={(event) => event.preventDefault()}
                    onDragEnter={() => setDraggingOverColumn(taskStatus)}
                    onDragLeave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                        setDraggingOverColumn("");
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDraggingOverColumn("");
                      const taskId = event.dataTransfer.getData("text/plain") || draggingTaskId;
                      moveTask(taskId, taskStatus, columnTasks.length);
                    }}
                  >
                    <div className="kanban-column-header">
                      <strong className={`status-pill ${getTaskStatusClass(taskStatus)}`}>
                        {taskStatus}
                      </strong>
                      <span className="kanban-count">{columnTasks.length}</span>
                    </div>

                    {columnTasks.length === 0 ? (
                      <p className="empty-state">Solte uma tarefa aqui.</p>
                    ) : (
                      columnTasks.map((task) => (
                        <article
                          aria-grabbed={draggingTaskId === task.id}
                          className={`task-card ${draggingTaskId === task.id ? "task-card-dragging" : ""} ${
                            savingTaskId === task.id ? "task-card-saving" : ""
                          }`}
                          draggable={!savingTaskId}
                          key={task.id}
                          onClick={() => openTaskDetail(task)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openTaskDetail(task);
                            }
                          }}
                          onDragEnd={() => setDraggingTaskId("")}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", task.id);
                            setDraggingTaskId(task.id);
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            const draggedTaskId = event.dataTransfer.getData("text/plain") || draggingTaskId;
                            const targetPosition = columnTasks.findIndex((columnTask) => columnTask.id === task.id);
                            moveTask(draggedTaskId, task.status, targetPosition);
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="task-card-header">
                            <strong>{task.title}</strong>
                            <span className={`status-pill ${getPriorityClass(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="row-detail">{getProjectName(task)}</p>
                          {(task.labels || []).length > 0 && (
                            <div className="label-chip-list">
                              {(task.labels || []).map((label) => (
                                <span className={`label-chip label-${label.color}`} key={label.id}>
                                  {label.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {(task.checklist_total || 0) > 0 && (
                            <div className="checklist-card-progress" aria-label="Progresso do checklist">
                              <div className="checklist-progress-label">
                                <span>Checklist</span>
                                <strong>
                                  {getTaskChecklistStats(task).done}/{getTaskChecklistStats(task).total}
                                </strong>
                              </div>
                              <div className="checklist-progress-track">
                                <span style={{ width: `${getTaskChecklistStats(task).percent}%` }} />
                              </div>
                            </div>
                          )}
                          <div className="task-card-footer">
                            <span className={`status-pill ${getTaskStatusClass(task.status)}`}>
                              {task.status}
                            </span>
                            <span className="meta-chip">
                              Prazo: {task.due_date || "não informado"}
                            </span>
                          </div>

                          <label className="status-move-control">
                            <span>Mover para</span>
                            <select
                              disabled={Boolean(savingTaskId)}
                              value={task.status}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => {
                                event.stopPropagation();
                                const destinationTasks = getTasksByStatus(event.target.value);
                                moveTask(task.id, event.target.value, destinationTasks.length);
                              }}
                            >
                              {statuses.map((availableStatus) => (
                                <option key={availableStatus} value={availableStatus}>
                                  {availableStatus}
                                </option>
                              ))}
                            </select>
                          </label>
                        </article>
                      ))
                    )}
                  </section>
                );
              })}
            </div>

            <aside className="task-log-panel" aria-label="Log de ações">
              <div className="panel-heading">
                <div>
                  <h2>Log de ações</h2>
                  <p className="row-detail">Mudanças desta sessão. O backend registra updates em activity_logs.</p>
                </div>
              </div>

              {actionLogs.length === 0 ? (
                <p className="empty-state">Arraste uma tarefa para iniciar o histórico.</p>
              ) : (
                <div className="task-action-list">
                  {actionLogs.map((log) => (
                    <div className={`task-action-item task-action-${log.status}`} key={log.id}>
                      <span className="signal-marker" />
                      <div>
                        <strong>{log.taskTitle}</strong>
                        <p className="row-detail">
                          {log.from} → {log.to}
                        </p>
                      </div>
                      <small>{log.status === "saving" ? "salvando" : log.timestamp}</small>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      {selectedTaskId && selectedTask && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeTaskDetail();
            }
          }}
        >
          <section
            aria-labelledby="task-detail-title"
            aria-modal="true"
            className="task-detail-modal"
            role="dialog"
          >
            <div className="task-detail-header">
              <div>
                <p className="eyebrow">Task detail</p>
                <h2 id="task-detail-title">{selectedTask.title}</h2>
                <p className="row-detail">{getProjectName(selectedTask)}</p>
              </div>
              <button className="ghost-action" onClick={closeTaskDetail} type="button">
                Fechar
              </button>
            </div>

            {detailError && (
              <div className="error-banner" role="alert">
                {detailError}
              </div>
            )}

            {isDetailLoading ? (
              <p className="muted" aria-live="polite">Carregando detalhe da tarefa...</p>
            ) : (
              <div className="task-detail-grid">
                <div className="task-detail-main">
                  <div className="task-detail-section">
                    <h3>Contexto</h3>
                    <div className="task-detail-fields">
                      <label className="field">
                        <span>Título</span>
                        <input
                          disabled={!canManageTasks || isDetailSaving}
                          value={detailTitle}
                          onChange={(event) => setDetailTitle(event.target.value)}
                        />
                      </label>

                      <label className="field">
                        <span>Descrição</span>
                        <textarea
                          disabled={!canManageTasks || isDetailSaving}
                          value={detailDescription}
                          onChange={(event) => setDetailDescription(event.target.value)}
                          rows={5}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="task-detail-section">
                    <div className="panel-heading">
                      <div>
                        <h3>Checklist</h3>
                        <p className="row-detail">Decomposição objetiva da entrega.</p>
                      </div>
                      <span>
                        {getChecklistStats(taskChecklist).done}/{getChecklistStats(taskChecklist).total} concluídos
                      </span>
                    </div>

                    <div className="checklist-progress">
                      <div className="checklist-progress-track">
                        <span style={{ width: `${getChecklistStats(taskChecklist).percent}%` }} />
                      </div>
                      <small>{getChecklistStats(taskChecklist).percent}%</small>
                    </div>

                    {canManageTasks && (
                      <div className="checklist-composer">
                        <input
                          disabled={isChecklistSaving}
                          value={newChecklistTitle}
                          onChange={(event) => setNewChecklistTitle(event.target.value)}
                          placeholder="Adicionar item de checklist"
                        />
                        <button
                          disabled={isChecklistSaving || !newChecklistTitle.trim()}
                          onClick={createChecklistItem}
                          type="button"
                        >
                          {isChecklistSaving ? "Salvando..." : "Adicionar"}
                        </button>
                      </div>
                    )}

                    {taskChecklist.length === 0 ? (
                      <p className="empty-state">Nenhum item de checklist ainda.</p>
                    ) : (
                      <div className="checklist-list">
                        {taskChecklist.map((item, index) => (
                          <article className={`checklist-item ${item.is_done ? "checklist-item-done" : ""}`} key={item.id}>
                            <label className="checklist-toggle">
                              <input
                                checked={item.is_done}
                                disabled={!canManageTasks || isChecklistSaving}
                                onChange={(event) => updateChecklistItem(item.id, { is_done: event.target.checked })}
                                type="checkbox"
                              />
                              <span>{item.title}</span>
                            </label>

                            {editingChecklistId === item.id ? (
                              <div className="checklist-edit">
                                <input
                                  disabled={isChecklistSaving}
                                  value={editingChecklistTitle}
                                  onChange={(event) => setEditingChecklistTitle(event.target.value)}
                                />
                                <input
                                  disabled={isChecklistSaving}
                                  type="date"
                                  value={editingChecklistDueDate}
                                  onChange={(event) => setEditingChecklistDueDate(event.target.value)}
                                />
                                <div className="inline-actions">
                                  <button
                                    className="ghost-action"
                                    disabled={isChecklistSaving}
                                    onClick={() => {
                                      setEditingChecklistId("");
                                      setEditingChecklistTitle("");
                                      setEditingChecklistDueDate("");
                                    }}
                                    type="button"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    disabled={isChecklistSaving || !editingChecklistTitle.trim()}
                                    onClick={() => saveChecklistEdit(item.id)}
                                    type="button"
                                  >
                                    Salvar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="checklist-item-meta">
                                <span className="meta-chip">Prazo: {formatDate(item.due_date)}</span>
                                <span className="meta-chip">
                                  Responsável: {item.assignee_id === currentUser?.id ? "você" : item.assignee_id || "sem responsável"}
                                </span>
                                {item.completed_at && <span className="meta-chip">Concluído: {formatDateTime(item.completed_at)}</span>}
                              </div>
                            )}

                            {canManageTasks && editingChecklistId !== item.id && (
                              <div className="inline-actions checklist-actions">
                                <button
                                  className="ghost-action"
                                  disabled={isChecklistSaving || index === 0}
                                  onClick={() => updateChecklistItem(item.id, { position: index - 1 })}
                                  type="button"
                                >
                                  Subir
                                </button>
                                <button
                                  className="ghost-action"
                                  disabled={isChecklistSaving || index === taskChecklist.length - 1}
                                  onClick={() => updateChecklistItem(item.id, { position: index + 1 })}
                                  type="button"
                                >
                                  Descer
                                </button>
                                <button
                                  className="ghost-action"
                                  disabled={isChecklistSaving}
                                  onClick={() => updateChecklistItem(item.id, { assignee_id: currentUser?.id || null })}
                                  type="button"
                                >
                                  Atribuir a mim
                                </button>
                                <button
                                  className="ghost-action"
                                  disabled={isChecklistSaving || !item.assignee_id}
                                  onClick={() => updateChecklistItem(item.id, { assignee_id: null })}
                                  type="button"
                                >
                                  Limpar responsável
                                </button>
                                <button
                                  className="ghost-action"
                                  disabled={isChecklistSaving}
                                  onClick={() => startEditingChecklistItem(item)}
                                  type="button"
                                >
                                  Editar
                                </button>
                                <button
                                  className="ghost-action"
                                  disabled={isChecklistSaving}
                                  onClick={() => deleteChecklistItem(item.id)}
                                  type="button"
                                >
                                  Excluir
                                </button>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="task-detail-section">
                    <div className="panel-heading">
                      <div>
                        <h3>Comentários</h3>
                        <p className="row-detail">Discussão operacional vinculada à tarefa.</p>
                      </div>
                    </div>

                    {canManageTasks && (
                      <div className="comment-composer">
                        <textarea
                          disabled={isCommentSaving}
                          value={newCommentBody}
                          onChange={(event) => setNewCommentBody(event.target.value)}
                          placeholder="Adicionar comentário"
                          rows={3}
                        />
                        <button
                          disabled={isCommentSaving || !newCommentBody.trim()}
                          onClick={createTaskComment}
                          type="button"
                        >
                          {isCommentSaving ? "Salvando..." : "Comentar"}
                        </button>
                      </div>
                    )}

                    {taskComments.length === 0 ? (
                      <p className="empty-state">Nenhum comentário registrado.</p>
                    ) : (
                      <div className="comment-list">
                        {taskComments.map((comment) => (
                          <article className="comment-item" key={comment.id}>
                            <div className="comment-meta">
                              <strong>{comment.created_by === currentUser?.id ? "Você" : "Usuário"}</strong>
                              <span>{formatDateTime(comment.created_at)}</span>
                            </div>

                            {editingCommentId === comment.id ? (
                              <div className="comment-edit">
                                <textarea
                                  disabled={isCommentSaving}
                                  value={editingCommentBody}
                                  onChange={(event) => setEditingCommentBody(event.target.value)}
                                  rows={3}
                                />
                                <div className="inline-actions">
                                  <button
                                    className="ghost-action"
                                    disabled={isCommentSaving}
                                    onClick={() => {
                                      setEditingCommentId("");
                                      setEditingCommentBody("");
                                    }}
                                    type="button"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    disabled={isCommentSaving || !editingCommentBody.trim()}
                                    onClick={() => saveCommentEdit(comment.id)}
                                    type="button"
                                  >
                                    Salvar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p>{comment.body}</p>
                                {canManageTasks && (
                                  <div className="inline-actions">
                                    <button
                                      className="ghost-action"
                                      disabled={isCommentSaving}
                                      onClick={() => startEditingComment(comment)}
                                      type="button"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      className="ghost-action"
                                      disabled={isCommentSaving}
                                      onClick={() => deleteTaskComment(comment.id)}
                                      type="button"
                                    >
                                      Excluir
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <aside className="task-detail-aside">
                  <div className="task-detail-section">
                    <h3>Operação</h3>
                    <div className="task-detail-meta">
                      <label className="field">
                        <span>Status</span>
                        <select
                          disabled={!canManageTasks || isDetailSaving}
                          value={detailStatus}
                          onChange={(event) => setDetailStatus(event.target.value)}
                        >
                          {statuses.map((availableStatus) => (
                            <option key={availableStatus} value={availableStatus}>
                              {availableStatus}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field">
                        <span>Prioridade</span>
                        <select
                          disabled={!canManageTasks || isDetailSaving}
                          value={detailPriority}
                          onChange={(event) => setDetailPriority(event.target.value)}
                        >
                          {priorities.map((availablePriority) => (
                            <option key={availablePriority} value={availablePriority}>
                              {availablePriority}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field">
                        <span>Prazo</span>
                        <input
                          disabled={!canManageTasks || isDetailSaving}
                          type="date"
                          value={detailDueDate}
                          onChange={(event) => setDetailDueDate(event.target.value)}
                        />
                      </label>

                      <div className="meta-stack">
                        <span className={`status-pill ${getTaskStatusClass(selectedTask.status)}`}>
                          {selectedTask.status}
                        </span>
                        <span className={`status-pill ${getPriorityClass(selectedTask.priority)}`}>
                          {selectedTask.priority}
                        </span>
                        <span className="meta-chip">Prazo: {formatDate(selectedTask.due_date)}</span>
                        <span className="meta-chip">Responsável: {selectedTask.assignee_id || "sem responsável"}</span>
                        <span className="meta-chip">Criada: {formatDateTime(selectedTask.created_at)}</span>
                        <span className="meta-chip">Atualizada: {formatDateTime(selectedTask.updated_at)}</span>
                      </div>

                      {canManageTasks ? (
                        <button
                          disabled={isDetailSaving || !detailTitle.trim()}
                          onClick={saveTaskDetail}
                          type="button"
                        >
                          {isDetailSaving ? "Salvando..." : "Salvar alterações"}
                        </button>
                      ) : (
                        <p className="empty-state">Seu perfil tem acesso somente leitura.</p>
                      )}
                    </div>
                  </div>

                  <div className="task-detail-section">
                    <h3>Labels</h3>
                    {(selectedTask.labels || []).length === 0 ? (
                      <p className="empty-state">Sem labels vinculadas.</p>
                    ) : (
                      <div className="label-chip-list">
                        {(selectedTask.labels || []).map((label) => (
                          <span className={`label-chip label-${label.color}`} key={label.id}>
                            {label.name}
                            {canManageTasks && (
                              <button
                                aria-label={`Remover label ${label.name}`}
                                disabled={isLabelSaving}
                                onClick={() => detachLabel(label.id)}
                                type="button"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {canManageTasks && (
                      <div className="label-manager">
                        <label className="field">
                          <span>Vincular label</span>
                          <select
                            disabled={isLabelSaving}
                            onChange={(event) => {
                              attachLabel(event.target.value);
                              event.target.value = "";
                            }}
                            value=""
                          >
                            <option value="">Selecione</option>
                            {labels
                              .filter((label) => !getSelectedTaskLabelIds().has(label.id))
                              .map((label) => (
                                <option key={label.id} value={label.id}>
                                  {label.name}
                                </option>
                              ))}
                          </select>
                        </label>

                        <div className="label-create-row">
                          <label className="field">
                            <span>Nova label</span>
                            <input
                              disabled={isLabelSaving}
                              value={newLabelName}
                              onChange={(event) => setNewLabelName(event.target.value)}
                              placeholder="Ex.: cliente aguardando"
                            />
                          </label>

                          <label className="field">
                            <span>Cor</span>
                            <select
                              disabled={isLabelSaving}
                              value={newLabelColor}
                              onChange={(event) => setNewLabelColor(event.target.value)}
                            >
                              {labelPalette.map((color) => (
                                <option key={color} value={color}>
                                  {color}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <button
                          disabled={isLabelSaving || !newLabelName.trim()}
                          onClick={createAndAttachLabel}
                          type="button"
                        >
                          {isLabelSaving ? "Salvando..." : "Criar e vincular"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="task-detail-section">
                    <h3>Atividade</h3>
                    {taskActivity.length === 0 ? (
                      <p className="empty-state">Sem atividade registrada.</p>
                    ) : (
                      <div className="activity-timeline">
                        {taskActivity.map((entry) => (
                          <article className="timeline-item" key={entry.id}>
                            <span className="signal-marker tone-violet" />
                            <div>
                              <strong>{getActivityLabel(entry.action)}</strong>
                              <p className="row-detail">
                                {formatActivityValue(entry.new_value) || formatActivityValue(entry.old_value) || "Registro operacional"}
                              </p>
                              <small>{formatDateTime(entry.performed_at)}</small>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

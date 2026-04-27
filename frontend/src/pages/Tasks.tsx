import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";

type Project = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  position: number;
  due_date?: string | null;
};

type ActionLog = {
  id: string;
  taskTitle: string;
  from: string;
  to: string;
  status: "saving" | "saved" | "failed";
  timestamp: string;
};

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

export function Tasks() {
  const actionLogCounter = useRef(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState("");
  const [savingTaskId, setSavingTaskId] = useState("");
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [error, setError] = useState("");

  async function fetchData() {
    setError("");
    setIsLoading(true);

    try {
      const [projectsRes, tasksRes, statusesRes, prioritiesRes] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks"),
        api.get("/metadata/task-statuses"),
        api.get("/metadata/task-priorities"),
      ]);

      setProjects(projectsRes.data);
      setTasks(tasksRes.data);
      setStatuses(statusesRes.data);
      setPriorities(prioritiesRes.data);
      setPriority((currentPriority) => currentPriority || prioritiesRes.data[1] || prioritiesRes.data[0] || "MEDIUM");
    } catch {
      setError("Não foi possível carregar as tarefas. Verifique se o backend está ativo.");
    } finally {
      setIsLoading(false);
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
        currentTasks.map((currentTask) =>
          currentTask.id === taskId ? { ...currentTask, ...response.data } : currentTask,
        ),
      );
      updateActionLog(logId, "saved");
    } catch {
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

    Promise.all([
      api.get("/projects"),
      api.get("/tasks"),
      api.get("/metadata/task-statuses"),
      api.get("/metadata/task-priorities"),
    ])
      .then(([projectsRes, tasksRes, statusesRes, prioritiesRes]) => {
        if (!isMounted) return;
        setProjects(projectsRes.data);
        setTasks(tasksRes.data);
        setStatuses(statusesRes.data);
        setPriorities(prioritiesRes.data);
        setPriority(prioritiesRes.data[1] || prioritiesRes.data[0] || "MEDIUM");
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Não foi possível carregar as tarefas. Verifique se o backend está ativo.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
            {savingTaskId ? "Salvando mudança..." : `${statuses.length} status disponíveis`}
          </span>
        </div>

        {isLoading ? (
          <p className="muted" aria-live="polite">Carregando tarefas...</p>
        ) : tasks.length === 0 ? (
          <p className="empty-state">Nenhuma tarefa cadastrada ainda.</p>
        ) : (
          <div className="task-workspace">
            <div className="kanban-board">
              {(statuses.length > 0 ? statuses : Array.from(new Set(tasks.map((task) => task.status)))).map((taskStatus) => {
                const columnTasks = getTasksByStatus(taskStatus);
                const isDropTarget = Boolean(draggingTaskId);

                return (
                  <section
                    className={`kanban-column ${isDropTarget ? "kanban-column-target" : ""}`}
                    key={taskStatus}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
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
                        >
                          <div className="task-card-header">
                            <strong>{task.title}</strong>
                            <span className={`status-pill ${getPriorityClass(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="row-detail">{getProjectName(task)}</p>
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
                              onChange={(event) => {
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
    </section>
  );
}

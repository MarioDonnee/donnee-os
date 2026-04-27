import { useEffect, useState } from "react";
import { api } from "../services/api";

type Project = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  project_id?: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
};

export function Tasks() {
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
    if (!projectId || !title.trim()) return;

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

          <button disabled={isSaving || !projectId || !title.trim()} onClick={createTask}>
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
          <h2>Tarefas cadastradas</h2>
          <span>{statuses.length} status disponíveis</span>
        </div>

        {isLoading ? (
          <p className="muted" aria-live="polite">Carregando tarefas...</p>
        ) : tasks.length === 0 ? (
          <p className="empty-state">Nenhuma tarefa cadastrada ainda.</p>
        ) : (
          tasks.map((task) => (
            <div className="row" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <p className="row-detail">{getProjectName(task)}</p>
              </div>

              <div className="row-meta">
                <strong className="status-pill">{task.status}</strong>
                <p className="row-detail">Prioridade: {task.priority}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

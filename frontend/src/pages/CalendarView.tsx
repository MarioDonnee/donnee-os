import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BriefcaseBusiness, ChevronLeft, ChevronRight, ListTodo } from "lucide-react";
import { api } from "../services/api";

type Task = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  priority: string;
  due_date?: string | null;
};

type Project = {
  id: string;
  client_id?: string | null;
  name: string;
  status: string;
  priority: string;
  due_date?: string | null;
};

type Client = {
  id: string;
  name: string;
};

type CalendarEvent = {
  id: string;
  type: "task" | "project";
  title: string;
  date: string;
  project?: Project;
  client?: Client;
  status: string;
  priority: string;
  isOverdue: boolean;
};

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

function isInactive(status: string) {
  return status === "DONE" || status === "CANCELLED" || status === "DELIVERED";
}

export function CalendarView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    Promise.all([api.get("/tasks"), api.get("/projects"), api.get("/clients")])
      .then(([tasksRes, projectsRes, clientsRes]) => {
        if (!isMounted) return;
        setTasks(tasksRes.data);
        setProjects(projectsRes.data);
        setClients(clientsRes.data);
      })
      .catch(() => {
        if (isMounted) setError("Não foi possível carregar o calendário.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const projectMap = useMemo(() => {
    const map: Record<string, Project> = {};
    projects.forEach((project) => {
      map[project.id] = project;
    });
    return map;
  }, [projects]);

  const clientMap = useMemo(() => {
    const map: Record<string, Client> = {};
    clients.forEach((client) => {
      map[client.id] = client;
    });
    return map;
  }, [clients]);

  const events = useMemo<CalendarEvent[]>(() => {
    const todayKey = toDateKey(new Date());

    const taskEvents = tasks
      .filter((task) => Boolean(task.due_date))
      .map((task) => {
        const project = projectMap[task.project_id];
        const client = project?.client_id ? clientMap[project.client_id] : undefined;
        const date = task.due_date || "";
        return {
          id: task.id,
          type: "task" as const,
          title: task.title,
          date,
          project,
          client,
          status: task.status,
          priority: task.priority,
          isOverdue: date < todayKey && !isInactive(task.status),
        };
      });

    const projectEvents = projects
      .filter((project) => Boolean(project.due_date))
      .map((project) => ({
        id: project.id,
        type: "project" as const,
        title: project.name,
        date: project.due_date || "",
        project,
        client: project.client_id ? clientMap[project.client_id] : undefined,
        status: project.status,
        priority: project.priority,
        isOverdue: (project.due_date || "") < todayKey && !isInactive(project.status),
      }));

    return [...taskEvents, ...projectEvents].sort((a, b) => a.date.localeCompare(b.date));
  }, [tasks, projects, projectMap, clientMap]);

  const days = useMemo(() => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const key = toDateKey(date);
      return {
        date,
        key,
        inMonth: date.getMonth() === currentMonth.getMonth(),
        isToday: key === toDateKey(new Date()),
        events: events.filter((event) => event.date.slice(0, 10) === key),
      };
    });
  }, [currentMonth, events]);

  const monthEvents = days.flatMap((day) => day.inMonth ? day.events : []);
  const overdueEvents = monthEvents.filter((event) => event.isOverdue);

  function shiftMonth(amount: number) {
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + amount, 1));
  }

  return (
    <section className="content">
      <header className="page-header">
        <p className="eyebrow">Donnée OS</p>
        <h1>Calendário</h1>
        <p>Prazo de tarefas e marcos de projetos em uma visão mensal.</p>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="summary-cards">
        <div className="summary-card">
          <ListTodo size={20} />
          <div>
            <strong>{monthEvents.filter((event) => event.type === "task").length}</strong>
            <span>Tarefas no mês</span>
          </div>
        </div>
        <div className="summary-card">
          <BriefcaseBusiness size={20} />
          <div>
            <strong>{monthEvents.filter((event) => event.type === "project").length}</strong>
            <span>Marcos de projeto</span>
          </div>
        </div>
        <div className={`summary-card ${overdueEvents.length > 0 ? "summary-card-risk" : ""}`}>
          <AlertTriangle size={20} />
          <div>
            <strong>{overdueEvents.length}</strong>
            <span>Atrasados</span>
          </div>
        </div>
      </div>

      <div className="panel timeline-surface">
        <div className="calendar-toolbar">
          <button className="icon-action" type="button" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
            <ChevronLeft size={16} />
          </button>
          <strong>{formatMonth(currentMonth)}</strong>
          <button className="icon-action" type="button" onClick={() => shiftMonth(1)} aria-label="Próximo mês">
            <ChevronRight size={16} />
          </button>
          <button className="ghost-action" type="button" onClick={() => setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
            Hoje
          </button>
        </div>

        {isLoading ? (
          <p className="muted" aria-live="polite">Carregando calendário...</p>
        ) : (
          <div className="calendar-grid">
            {weekdayLabels.map((label) => (
              <div className="calendar-weekday" key={label}>{label}</div>
            ))}

            {days.map((day) => (
              <div
                className={`calendar-day ${!day.inMonth ? "calendar-day-muted" : ""} ${day.isToday ? "calendar-day-today" : ""}`}
                key={day.key}
              >
                <div className="calendar-day-head">
                  <span>{day.date.getDate()}</span>
                  {day.events.length > 0 && <small>{day.events.length}</small>}
                </div>

                <div className="calendar-event-list">
                  {day.events.slice(0, 4).map((event) => (
                    event.type === "project" ? (
                      <Link
                        className={`calendar-event calendar-event-project ${event.isOverdue ? "calendar-event-risk" : ""}`}
                        key={`${event.type}-${event.id}`}
                        to={`/projects/${event.id}`}
                      >
                        <BriefcaseBusiness size={12} />
                        <span>{event.title}</span>
                      </Link>
                    ) : (
                      <Link
                        className={`calendar-event ${event.isOverdue ? "calendar-event-risk" : ""}`}
                        key={`${event.type}-${event.id}`}
                        to="/tasks"
                      >
                        <ListTodo size={12} />
                        <span>{event.title}</span>
                      </Link>
                    )
                  ))}
                  {day.events.length > 4 && <span className="calendar-more">+{day.events.length - 4}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isLoading && monthEvents.length === 0 && (
        <div className="panel">
          <p className="empty-state">Nenhuma tarefa ou projeto com prazo neste mês.</p>
        </div>
      )}
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import {
  AlertTriangle,
  ArrowUpRight,
  Briefcase,
  CheckCircle,
  Clock,
  FolderKanban,
  Plus,
  Radio,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getRiskStatusClass, getRiskStatusLabel } from "../utils/risk";

type OverdueTaskItem = {
  id: string;
  title: string;
  project_name: string;
  due_date: string | null;
};

type ActivityItem = {
  id: string;
  entity_type: string;
  action: string;
  performed_by_name: string | null;
  performed_at: string | null;
};

type RiskProjectItem = {
  id: string;
  name: string;
  health_score: number | null;
  risk_status: string;
  due_date: string | null;
};

type DashboardSummary = {
  total_clients: number;
  total_projects: number;
  total_tasks: number;
  open_tasks: number;
  done_tasks: number;
  overdue_tasks: number;
  blocked_tasks: number;
  urgent_open_tasks: number;
  due_today_tasks: number;
  projects_at_risk: number;
  tasks_by_status: Record<string, number>;
  tasks_by_priority: Record<string, number>;
  overdue_tasks_list: OverdueTaskItem[];
  risk_projects: RiskProjectItem[];
  recent_activity: ActivityItem[];
};

const emptySummary: DashboardSummary = {
  total_clients: 0,
  total_projects: 0,
  total_tasks: 0,
  open_tasks: 0,
  done_tasks: 0,
  overdue_tasks: 0,
  blocked_tasks: 0,
  urgent_open_tasks: 0,
  due_today_tasks: 0,
  projects_at_risk: 0,
  tasks_by_status: {},
  tasks_by_priority: {},
  overdue_tasks_list: [],
  risk_projects: [],
  recent_activity: [],
};

let cachedDashboardSummary: DashboardSummary | null = null;

type MetricCardProps = {
  title: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  tone: "violet" | "cyan" | "green" | "amber" | "red";
  isLoading?: boolean;
};

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

function formatOverdueAge(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "1 dia";
  if (days < 7) return `${days} dias`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 semana" : `${weeks} semanas`;
}

function getActivityLabel(action: string, entityType: string): string {
  const labels: Record<string, string> = {
    created: `${entityType} criado`,
    updated: `${entityType} atualizado`,
    moved: "Tarefa movida",
    comment_created: "Comentário adicionado",
    checklist_item_completed: "Checklist concluído",
  };
  return labels[action] ?? action.replace(/_/g, " ");
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("done") || normalized.includes("delivered") || normalized.includes("conclu")) {
    return "tone-green";
  }

  if (normalized.includes("blocked") || normalized.includes("overdue") || normalized.includes("atras")) {
    return "tone-red";
  }

  if (normalized.includes("review") || normalized.includes("validation")) {
    return "tone-cyan";
  }

  if (normalized.includes("progress") || normalized.includes("doing") || normalized.includes("active")) {
    return "tone-cyan";
  }

  if (normalized.includes("urgent") || normalized.includes("high") || normalized.includes("attention")) {
    return "tone-amber";
  }

  return "tone-violet";
}

function getPriorityTone(priority: string) {
  const normalized = priority.toLowerCase();

  if (normalized.includes("urgent") || normalized.includes("high")) {
    return "tone-red";
  }

  if (normalized.includes("medium")) {
    return "tone-amber";
  }

  if (normalized.includes("low")) {
    return "tone-cyan";
  }

  return "tone-violet";
}

function MetricCard({ title, value, detail, icon: Icon, tone, isLoading }: MetricCardProps) {
  return (
    <div className={`glass-card metric-card metric-${tone} ${isLoading ? "is-loading" : ""}`}>
      <div className="metric-card-top">
        <div className="metric-icon">
          <Icon size={22} />
        </div>
        <ArrowUpRight size={16} />
      </div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-title">{title}</span>
      <small>{detail}</small>
    </div>
  );
}

function DistributionPanel({
  title,
  entries,
  total,
  toneFor,
  isLoading,
}: {
  title: string;
  entries: Array<[string, number]>;
  total: number;
  toneFor: (key: string) => string;
  isLoading?: boolean;
}) {
  return (
    <div className={`panel distribution-panel ${isLoading ? "is-loading" : ""}`}>
      <div className="panel-heading">
        <h2>{title}</h2>
        <span>{isLoading ? "atualizando" : `${total} tarefas`}</span>
      </div>

      <div className="distribution-list">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div className="distribution-row skeleton-row" key={index}>
              <div className="skeleton-line skeleton-line-short" />
              <div className="skeleton-line" />
              <div className="skeleton-dot" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <p className="empty-state">Sem dados para exibir.</p>
        ) : (
          entries.map(([label, count]) => {
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            const tone = toneFor(label);

            return (
              <div className="distribution-row" key={label}>
                <div className="distribution-label">
                  <span className={`status-dot ${tone}`} />
                  <strong>{label}</strong>
                  <small>{percent}%</small>
                </div>
                <div className="distribution-track" aria-label={`${label}: ${count}`}>
                  <span className={tone} style={{ width: `${Math.max(percent, 4)}%` }} />
                </div>
                <b>{count}</b>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(cachedDashboardSummary);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    api
      .get("/dashboard/summary")
      .then((response) => {
        if (!isMounted) return;
        cachedDashboardSummary = response.data;
        setSummary(response.data);
        setError("");
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Não foi possível carregar o dashboard. Verifique se o backend está ativo.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsRefreshing(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleSummary = summary ?? emptySummary;
  const isInitialLoading = !summary && isRefreshing;

  const statusEntries = useMemo(
    () => Object.entries(visibleSummary.tasks_by_status).sort((a, b) => b[1] - a[1]),
    [visibleSummary.tasks_by_status],
  );

  const priorityEntries = useMemo(
    () => Object.entries(visibleSummary.tasks_by_priority).sort((a, b) => b[1] - a[1]),
    [visibleSummary.tasks_by_priority],
  );

  const totalTasks = Math.max(visibleSummary.total_tasks, 1);
  const donePercent = Math.round((visibleSummary.done_tasks / totalTasks) * 100);
  const overduePercent = Math.round((visibleSummary.overdue_tasks / totalTasks) * 100);

  return (
    <section className="content dashboard-content">
      <header className="page-header dashboard-hero">
        <div className="hero-orbit" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">Donnée OS</p>
          <h1>Intelligence Console</h1>
          <p>
            Visão operacional da consultoria, conectando clientes, projetos e tarefas em uma
            superfície executiva de decisão.
          </p>
          <span className="refresh-indicator" aria-live="polite">
            {isRefreshing ? "Atualizando dados..." : "Dados sincronizados"}
          </span>
        </div>

        <div className="quick-actions" aria-label="Ações rápidas">
          <Link className="action-button" to="/clients">
            <Plus size={16} />
            Novo cliente
          </Link>
          <Link className="action-button" to="/projects">
            <Plus size={16} />
            Novo projeto
          </Link>
          <Link className="action-button action-button-primary" to="/tasks">
            <Plus size={16} />
            Nova tarefa
          </Link>
        </div>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <section className="metrics-grid dashboard-metrics">
        <MetricCard title="Clientes" value={visibleSummary.total_clients} detail="+2 este mês" icon={Users} tone="violet" isLoading={isInitialLoading} />
        <MetricCard title="Projetos" value={visibleSummary.total_projects} detail="pipeline ativo" icon={Briefcase} tone="cyan" isLoading={isInitialLoading} />
        <MetricCard title="Tarefas" value={visibleSummary.total_tasks} detail="base operacional" icon={FolderKanban} tone="violet" isLoading={isInitialLoading} />
        <MetricCard title="Abertas" value={visibleSummary.open_tasks} detail={`${100 - donePercent}% em fluxo`} icon={Clock} tone="amber" isLoading={isInitialLoading} />
        <MetricCard title="Concluídas" value={visibleSummary.done_tasks} detail={`${donePercent}% do total`} icon={CheckCircle} tone="green" isLoading={isInitialLoading} />
        <MetricCard title="Atrasadas" value={visibleSummary.overdue_tasks} detail={`${overduePercent}% em risco`} icon={Clock} tone="red" isLoading={isInitialLoading} />
        <MetricCard title="Bloqueios" value={visibleSummary.blocked_tasks} detail="ativos no fluxo" icon={AlertTriangle} tone="red" isLoading={isInitialLoading} />
        <MetricCard title="Urgentes" value={visibleSummary.urgent_open_tasks} detail="abertas agora" icon={Sparkles} tone="amber" isLoading={isInitialLoading} />
        <MetricCard title="Hoje" value={visibleSummary.due_today_tasks} detail="vencem hoje" icon={Clock} tone="cyan" isLoading={isInitialLoading} />
        <MetricCard title="Projetos em risco" value={visibleSummary.projects_at_risk} detail="health abaixo de 60" icon={Briefcase} tone="red" isLoading={isInitialLoading} />
      </section>

      <section className="dashboard-panels">
        <DistributionPanel
          entries={statusEntries}
          title="Tarefas por status"
          toneFor={getStatusTone}
          total={visibleSummary.total_tasks}
          isLoading={isInitialLoading}
        />
        <DistributionPanel
          entries={priorityEntries}
          title="Tarefas por prioridade"
          toneFor={getPriorityTone}
          total={visibleSummary.total_tasks}
          isLoading={isInitialLoading}
        />
      </section>

      <section className="dashboard-widgets">
        <div className="panel risk-panel">
          <div className="panel-heading">
            <h2>Tarefas em atraso</h2>
            <span>{visibleSummary.overdue_tasks} sinalizadas</span>
          </div>

          <div className="signal-list">
            {isInitialLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div className="signal-item skeleton-row" key={i}>
                  <div className="skeleton-dot" />
                  <div style={{ flex: 1 }}><div className="skeleton-line" /></div>
                </div>
              ))
            ) : visibleSummary.overdue_tasks_list.length === 0 ? (
              <p className="empty-state">Nenhuma tarefa em atraso.</p>
            ) : (
              visibleSummary.overdue_tasks_list.map((task) => (
                <div className="signal-item" key={task.id}>
                  <span className="signal-marker tone-red" />
                  <div>
                    <strong>{task.title}</strong>
                    <p className="row-detail">{task.project_name}</p>
                  </div>
                  <small>{formatOverdueAge(task.due_date)}</small>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="panel-heading">
            <h2>Atividade recente</h2>
            <span>ao vivo</span>
          </div>

          <div className="activity-stream">
            {isInitialLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div className="activity-item skeleton-row" key={i}>
                  <div className="skeleton-dot" />
                  <div style={{ flex: 1 }}><div className="skeleton-line" /></div>
                </div>
              ))
            ) : visibleSummary.recent_activity.length === 0 ? (
              <p className="empty-state">Nenhuma atividade registrada ainda.</p>
            ) : (
              visibleSummary.recent_activity.map((item) => (
                <div className="activity-item" key={item.id}>
                  <Radio size={15} />
                  <div>
                    <strong>{getActivityLabel(item.action, item.entity_type)}</strong>
                    <p className="row-detail">
                      {item.performed_by_name ?? "Sistema"} · {formatRelativeTime(item.performed_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel risk-project-panel">
          <div className="panel-heading">
            <h2>Projetos em risco</h2>
            <span>{visibleSummary.projects_at_risk} ativos</span>
          </div>

          <div className="signal-list">
            {isInitialLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div className="signal-item skeleton-row" key={i}>
                  <div className="skeleton-dot" />
                  <div style={{ flex: 1 }}><div className="skeleton-line" /></div>
                </div>
              ))
            ) : visibleSummary.risk_projects.length === 0 ? (
              <p className="empty-state">Nenhum projeto em risco crítico.</p>
            ) : (
              visibleSummary.risk_projects.map((project) => (
                <Link className="signal-item signal-item-link" key={project.id} to={`/projects/${project.id}`}>
                  <span className={`risk-dot ${getRiskStatusClass(project.risk_status)}`} />
                  <div>
                    <strong>{project.name}</strong>
                    <p className="row-detail">
                      {getRiskStatusLabel(project.risk_status)} · {project.health_score ?? 0}%
                    </p>
                  </div>
                  <small>{project.due_date ? new Date(project.due_date).toLocaleDateString("pt-BR") : "sem prazo"}</small>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </section>
  );
}

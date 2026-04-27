import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Briefcase, CheckCircle, Clock, FolderKanban, Users } from "lucide-react";

type DashboardSummary = {
  total_clients: number;
  total_projects: number;
  total_tasks: number;
  open_tasks: number;
  done_tasks: number;
  overdue_tasks: number;
  tasks_by_status: Record<string, number>;
  tasks_by_priority: Record<string, number>;
};

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: any;
}) {
  return (
    <div className="glass-card">
      <div className="metric-icon">
        <Icon size={22} />
      </div>
      <span className="metric-title">{title}</span>
      <strong className="metric-value">{value}</strong>
    </div>
  );
}

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api.get("/dashboard/summary").then((response) => {
      setSummary(response.data);
    });
  }, []);

  if (!summary) {
    return <main className="app-shell">Carregando...</main>;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">d</span>
          <span>donnée</span>
        </div>

        <nav>
          <a className="active">Dashboard</a>
          <a>Clientes</a>
          <a>Projetos</a>
          <a>Tarefas</a>
          <a>Relatórios</a>
        </nav>

        <div className="tagline">
          DESENVOLVEMOS SOLUÇÕES.
          <br />
          IMPULSIONAMOS INTELIGÊNCIA.
        </div>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Donnée OS</p>
            <h1>Dashboard</h1>
            <p>Visão operacional da consultoria em tempo real.</p>
          </div>
        </header>

        <section className="metrics-grid">
          <MetricCard title="Clientes" value={summary.total_clients} icon={Users} />
          <MetricCard title="Projetos" value={summary.total_projects} icon={Briefcase} />
          <MetricCard title="Tarefas" value={summary.total_tasks} icon={FolderKanban} />
          <MetricCard title="Abertas" value={summary.open_tasks} icon={Clock} />
          <MetricCard title="Concluídas" value={summary.done_tasks} icon={CheckCircle} />
          <MetricCard title="Atrasadas" value={summary.overdue_tasks} icon={Clock} />
        </section>

        <section className="panels-grid">
          <div className="panel">
            <h2>Tarefas por status</h2>
            {Object.entries(summary.tasks_by_status).map(([status, count]) => (
              <div className="row" key={status}>
                <span>{status}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>

          <div className="panel">
            <h2>Tarefas por prioridade</h2>
            {Object.entries(summary.tasks_by_priority).map(([priority, count]) => (
              <div className="row" key={priority}>
                <span>{priority}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

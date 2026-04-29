import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Link, NavLink, Outlet } from "react-router-dom";
import { Bell, BriefcaseBusiness, Calendar, LayoutDashboard, ListTodo, LogOut, Rows3, Table2, User2, UserCog, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { useAuth } from "./auth/useAuth";
import { ClientDetail } from "./pages/ClientDetail";
import { Clients } from "./pages/Clients";
import { CalendarView } from "./pages/CalendarView";
import { Dashboard } from "./pages/Dashboard";
import { InactiveAccess } from "./pages/InactiveAccess";
import { Login } from "./pages/Login";
import { MyWork } from "./pages/MyWork";
import { Notifications } from "./pages/Notifications";
import { Team } from "./pages/Team";
import { Timeline } from "./pages/Timeline";
import { PendingAccess } from "./pages/PendingAccess";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Projects } from "./pages/Projects";
import { Tasks } from "./pages/Tasks";
import { TasksTable } from "./pages/TasksTable";
import { api } from "./services/api";
import "./styles.css";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string | null;
  read_at: string | null;
};

const navItems: NavGroup[] = [
  {
    label: "Command",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/my-work", label: "Meu Trabalho", icon: User2 },
      { to: "/team", label: "Equipe", icon: UserCog },
    ],
  },
  {
    label: "Operação",
    items: [
      { to: "/clients", label: "Clientes", icon: Users },
      { to: "/projects", label: "Projetos", icon: BriefcaseBusiness },
      { to: "/tasks", label: "Kanban", icon: ListTodo },
      { to: "/tasks/table", label: "Tabela", icon: Table2 },
      { to: "/calendar", label: "Calendário", icon: Calendar },
      { to: "/timeline", label: "Timeline", icon: Rows3 },
    ],
  },
];

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

function getNotificationHref(notification: NotificationItem): string | null {
  if (notification.entity_type === "task") return "/tasks";
  if (notification.entity_type === "project" && notification.entity_id) return `/projects/${notification.entity_id}`;
  if (notification.entity_type === "client" && notification.entity_id) return `/clients/${notification.entity_id}`;
  return null;
}

function Layout() {
  const { currentUser, signOut } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function pollCount() {
      try {
        const res = await api.get<{ unread_count: number }>("/notifications/unread-count");
        setUnreadCount(res.data.unread_count);
      } catch {
        // Notifications are non-critical for shell navigation.
      }
    }
    pollCount();
    const id = setInterval(pollCount, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  async function openNotifications() {
    if (notifOpen) {
      setNotifOpen(false);
      return;
    }
    setNotifOpen(true);
    setNotifLoading(true);
    try {
      const res = await api.get<{ items: NotificationItem[]; unread_count: number }>("/notifications", {
        params: { limit: 8 },
      });
      setNotifications(res.data.items);
      setUnreadCount(res.data.unread_count);
    } catch {
      // Keep the app shell usable if notifications are temporarily unavailable.
    }
    setNotifLoading(false);
  }

  async function markAllNotificationsRead() {
    try {
      await api.patch("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    } catch {
      // Reading notifications should not block navigation.
    }
  }

  return (
    <main className="app-shell">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo
      </a>

      <aside className="sidebar">
        <div className="brand" aria-label="Donnée OS">
          <span className="brand-mark">d</span>
          <span>donnée</span>
        </div>

        <nav aria-label="Navegação principal">
          {navItems.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  className={({ isActive }) => (isActive ? "active" : undefined)}
                  end={end}
                  key={to}
                  to={to}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <span className="user-avatar">
              {currentUser?.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "DO"}
            </span>
            <div>
              <strong>{currentUser?.name || "Donnée Core"}</strong>
              <small>{currentUser?.email || "Operational Intelligence"}</small>
              <small>{currentUser?.role || "Role"}</small>
            </div>
          </div>

          <button
            className={`ghost-action notif-bell-btn ${notifOpen ? "notif-bell-btn--active" : ""}`}
            type="button"
            onClick={openNotifications}
            aria-label="Notificações"
            aria-expanded={notifOpen}
          >
            <Bell size={15} />
            Notificações
            {unreadCount > 0 && (
              <span className="notif-badge" aria-label={`${unreadCount} não lidas`}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <button className="ghost-action sidebar-logout" type="button" onClick={signOut}>
            <LogOut size={15} />
            Sair
          </button>

          <div className="tagline">
            DESENVOLVEMOS SOLUÇÕES.
            <br />
            IMPULSIONAMOS INTELIGÊNCIA.
          </div>
        </div>
      </aside>

      {notifOpen && (
        <div className="notif-panel" ref={panelRef} role="dialog" aria-label="Notificações">
          <div className="notif-panel-header">
            <div>
              <strong>Notificações</strong>
              <span>{unreadCount > 0 ? `${unreadCount} não lidas` : "Tudo em dia"}</span>
            </div>
            <div className="notif-panel-actions">
              {unreadCount > 0 && (
                <button className="notif-link-action" type="button" onClick={markAllNotificationsRead}>
                  Ler todas
                </button>
              )}
              <button
                className="notif-panel-close"
                type="button"
                onClick={() => setNotifOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
          </div>

          {notifLoading ? (
            <p className="notif-empty">Carregando...</p>
          ) : notifications.length === 0 ? (
            <p className="notif-empty">Nenhuma notificação ainda.</p>
          ) : (
            <ul className="notif-list">
              {notifications.map((n) => {
                const href = getNotificationHref(n);
                const content = (
                  <>
                    <strong className="notif-item-title">{n.title}</strong>
                    <span className="notif-item-body">{n.body}</span>
                    <time className="notif-item-time">{formatRelativeTime(n.created_at)}</time>
                  </>
                );

                return (
                  <li key={n.id} className={`notif-item ${!n.is_read ? "notif-item--unread" : ""}`}>
                    {href ? (
                      <Link to={href} onClick={() => setNotifOpen(false)}>
                        {content}
                      </Link>
                    ) : content}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="notif-panel-footer">
            <Link to="/notifications" onClick={() => setNotifOpen(false)}>
              Ver central de notificações
            </Link>
          </div>
        </div>
      )}

      <div className="route-slot" id="main-content" tabIndex={-1}>
        <Outlet />
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/access-pending" element={<PendingAccess />} />
          <Route path="/access-inactive" element={<InactiveAccess />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:clientId" element={<ClientDetail />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:projectId" element={<ProjectDetail />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="tasks/table" element={<TasksTable />} />
              <Route path="calendar" element={<CalendarView />} />
              <Route path="timeline" element={<Timeline />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="my-work" element={<MyWork />} />
              <Route path="team" element={<Team />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter, Routes, Route, NavLink, Outlet } from "react-router-dom";
import { BriefcaseBusiness, LayoutDashboard, ListTodo, LogOut, Table2, User2, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { useAuth } from "./auth/useAuth";
import { ClientDetail } from "./pages/ClientDetail";
import { Clients } from "./pages/Clients";
import { Dashboard } from "./pages/Dashboard";
import { InactiveAccess } from "./pages/InactiveAccess";
import { Login } from "./pages/Login";
import { MyWork } from "./pages/MyWork";
import { PendingAccess } from "./pages/PendingAccess";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Projects } from "./pages/Projects";
import { Tasks } from "./pages/Tasks";
import { TasksTable } from "./pages/TasksTable";
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

const navItems: NavGroup[] = [
  {
    label: "Command",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/my-work", label: "Meu Trabalho", icon: User2 },
    ],
  },
  {
    label: "Operação",
    items: [
      { to: "/clients", label: "Clientes", icon: Users },
      { to: "/projects", label: "Projetos", icon: BriefcaseBusiness },
      { to: "/tasks", label: "Kanban", icon: ListTodo },
      { to: "/tasks/table", label: "Tabela", icon: Table2 },
    ],
  },
];

function Layout() {
  const { currentUser, signOut } = useAuth();

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
              <Route path="my-work" element={<MyWork />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

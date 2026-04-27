import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { BriefcaseBusiness, LayoutDashboard, ListTodo, Users } from "lucide-react";
import { Dashboard } from "./pages/Dashboard";
import { Clients } from "./pages/Clients";
import { Projects } from "./pages/Projects";
import { Tasks } from "./pages/Tasks";
import "./styles.css";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/clients", label: "Clientes", icon: Users },
  { to: "/projects", label: "Projetos", icon: BriefcaseBusiness },
  { to: "/tasks", label: "Tarefas", icon: ListTodo },
];

function Layout() {
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
          {navItems.map(({ to, label, icon: Icon, end }) => (
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
        </nav>

        <div className="tagline">
          DESENVOLVEMOS SOLUÇÕES.
          <br />
          IMPULSIONAMOS INTELIGÊNCIA.
        </div>
      </aside>

      <div className="route-slot" id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<Tasks />} />
        </Routes>
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;

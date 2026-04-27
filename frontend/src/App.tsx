import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Clients } from "./pages/Clients";
import { Projects } from "./pages/Projects";
import { Tasks } from "./pages/Tasks";
import "./styles.css";

function Layout() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">d</span>
          <span>donnée</span>
        </div>

        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/clients">Clientes</NavLink>
          <NavLink to="/projects">Projetos</NavLink>
          <NavLink to="/tasks">Tarefas</NavLink>
        </nav>

        <div className="tagline">
          DESENVOLVEMOS SOLUÇÕES.
          <br />
          IMPULSIONAMOS INTELIGÊNCIA.
        </div>
      </aside>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/tasks" element={<Tasks />} />
      </Routes>
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

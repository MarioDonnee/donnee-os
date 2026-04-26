from fastapi import FastAPI

from app.api.routes import health, db_test, tasks, clients, projects

app = FastAPI(
    title="Donnée OS API",
    version="0.1.0",
)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(db_test.router, prefix="/db-test", tags=["Database"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(clients.router, prefix="/clients", tags=["Clients"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
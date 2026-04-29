from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, health, db_test, clients, projects, tasks, dashboard, metadata, comments, labels, checklists, users, notifications

app = FastAPI(
    title="Donnée OS API",
    version="0.1.0",
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(db_test.router, prefix="/db-test", tags=["Database"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(clients.router, prefix="/clients", tags=["Clients"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(comments.router, tags=["Comments"])
app.include_router(labels.router, tags=["Labels"])
app.include_router(checklists.router, tags=["Checklists"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(metadata.router, prefix="/metadata", tags=["Metadata"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(notifications.router, tags=["Notifications"])

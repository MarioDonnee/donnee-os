from fastapi import FastAPI

from app.api.routes import health, db_test

app = FastAPI(
    title="Donnée OS API",
    version="0.1.0",
)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(db_test.router, prefix="/db-test", tags=["Database"])
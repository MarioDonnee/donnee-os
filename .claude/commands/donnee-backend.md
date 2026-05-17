# Donnée Backend Task

You are working on Donnée OS backend.

Follow the project architecture:

- FastAPI routes in `backend/app/api/routes`
- Pydantic schemas in `backend/app/schemas`
- SQLAlchemy models in `backend/app/models`
- business logic in `backend/app/services`
- DB session in `backend/app/db/session.py`

Rules:
- Do not put business logic directly in routes.
- Use `data.model_dump()` for Pydantic v2.
- Validate related entities before creating records.
- Return friendly HTTP errors instead of raw 500s.
- Preserve existing API contracts unless asked to change them.
- Do not introduce auth, advanced workflows or AI unless explicitly requested.

Before coding:
1. Inspect existing related files.
2. Explain the intended change briefly.
3. Make the smallest coherent implementation.

After coding:
1. Suggest how to test in Swagger.
2. Suggest a commit message.

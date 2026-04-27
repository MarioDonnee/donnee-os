from fastapi import APIRouter

router = APIRouter()


@router.get("/task-statuses")
def get_task_statuses():
    return [
        "BACKLOG",
        "IN_PROGRESS",
        "REVIEW",
        "BLOCKED",
        "DONE",
        "CANCELLED",
    ]


@router.get("/task-priorities")
def get_task_priorities():
    return [
        "LOW",
        "MEDIUM",
        "HIGH",
        "URGENT",
    ]


@router.get("/project-statuses")
def get_project_statuses():
    return [
        "DISCOVERY",
        "PLANNING",
        "IN_PROGRESS",
        "VALIDATION",
        "DELIVERED",
        "MONITORING",
        "CANCELLED",
    ]


@router.get("/client-statuses")
def get_client_statuses():
    return [
        "LEAD",
        "PROSPECTING",
        "ACTIVE",
        "PAUSED",
        "CLOSED",
    ]


@router.get("/user-roles")
def get_user_roles():
    return [
        "ADMIN",
        "MANAGER",
        "ANALYST",
        "CLIENT",
        "VIEWER",
    ]

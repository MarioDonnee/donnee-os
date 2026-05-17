from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.schemas.activity_log import ActivityLogResponse
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.services.activity_log_service import get_logs_for_entity
from app.services.client_service import (
    create_client,
    get_clients,
    get_client_by_ref,
    update_client,
)

router = APIRouter()


@router.post("", response_model=ClientResponse)
def create(client: ClientCreate, db: Session = Depends(get_db), current_user=Depends(require_roles("ADMIN", "MANAGER"))):
    return create_client(db, client, current_user)


@router.get("", response_model=list[ClientResponse])
def list_clients(db: Session = Depends(get_db), current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER"))):
    return get_clients(db)


@router.get("/{client_ref}", response_model=ClientResponse)
def get_one(client_ref: str, db: Session = Depends(get_db), current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER"))):
    client = get_client_by_ref(db, client_ref)

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    return client


@router.patch("/{client_ref}", response_model=ClientResponse)
def update(client_ref: str, client: ClientUpdate, db: Session = Depends(get_db), current_user=Depends(require_roles("ADMIN", "MANAGER"))):
    existing_client = get_client_by_ref(db, client_ref)

    if not existing_client:
        raise HTTPException(status_code=404, detail="Client not found")

    updated_client = update_client(db, existing_client.id, client, current_user)

    if not updated_client:
        raise HTTPException(status_code=404, detail="Client not found")

    return updated_client


@router.get("/{client_ref}/activity", response_model=list[ActivityLogResponse])
def get_activity(client_ref: str, db: Session = Depends(get_db), current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER"))):
    client = get_client_by_ref(db, client_ref)

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    return get_logs_for_entity(db, "client", client.id)

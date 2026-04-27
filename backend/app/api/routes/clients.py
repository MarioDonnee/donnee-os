from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.services.client_service import (
    create_client,
    get_clients,
    get_client_by_id,
    update_client,
)

router = APIRouter()


@router.post("", response_model=ClientResponse)
def create(client: ClientCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_client(db, client, current_user)


@router.get("", response_model=list[ClientResponse])
def list_clients(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_clients(db)


@router.get("/{client_id}", response_model=ClientResponse)
def get_one(client_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    client = get_client_by_id(db, client_id)

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    return client


@router.patch("/{client_id}", response_model=ClientResponse)
def update(client_id: UUID, client: ClientUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    updated_client = update_client(db, client_id, client)

    if not updated_client:
        raise HTTPException(status_code=404, detail="Client not found")

    return updated_client

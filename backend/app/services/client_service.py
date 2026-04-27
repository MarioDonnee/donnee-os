from uuid import UUID
from sqlalchemy.orm import Session

from app.models.client import Client


def create_client(db: Session, data, current_user=None):
    client_data = data.model_dump()

    if current_user:
        client_data["created_by"] = current_user.id

    client = Client(**client_data)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def get_clients(db: Session):
    return db.query(Client).filter(Client.deleted_at.is_(None)).all()


def get_client_by_id(db: Session, client_id: UUID):
    return (
        db.query(Client)
        .filter(Client.id == client_id, Client.deleted_at.is_(None))
        .first()
    )


def update_client(db: Session, client_id: UUID, data):
    client = get_client_by_id(db, client_id)

    if not client:
        return None

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)
    return client

from uuid import UUID
from sqlalchemy import String, cast
from sqlalchemy.orm import Session

from app.models.client import Client
from app.services.activity_log_service import create_log


def create_client(db: Session, data, current_user=None):
    client_data = data.model_dump()

    if current_user:
        client_data["created_by"] = current_user.id

    client = Client(**client_data)
    db.add(client)
    db.commit()
    db.refresh(client)

    create_log(
        db=db,
        entity_type="client",
        entity_id=client.id,
        action="created",
        new_value=data.model_dump(mode="json"),
        user_id=current_user.id if current_user else None,
    )

    return client


def get_clients(db: Session):
    return db.query(Client).filter(Client.deleted_at.is_(None)).all()


def get_client_by_id(db: Session, client_id: UUID):
    return (
        db.query(Client)
        .filter(Client.id == client_id, Client.deleted_at.is_(None))
        .first()
    )


def get_client_by_ref(db: Session, client_ref: str):
    try:
        return get_client_by_id(db, UUID(client_ref))
    except ValueError:
        pass

    if len(client_ref) < 8:
        return None

    matches = (
        db.query(Client)
        .filter(
            cast(Client.id, String).ilike(f"{client_ref}%"),
            Client.deleted_at.is_(None),
        )
        .limit(2)
        .all()
    )

    return matches[0] if len(matches) == 1 else None


def update_client(db: Session, client_id: UUID, data, current_user=None):
    client = get_client_by_id(db, client_id)

    if not client:
        return None

    old_value = {
        "name": client.name,
        "segment": client.segment,
        "status": client.status,
        "owner_id": str(client.owner_id) if client.owner_id else None,
    }

    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)

    create_log(
        db=db,
        entity_type="client",
        entity_id=client.id,
        action="updated",
        old_value=old_value,
        new_value=data.model_dump(mode="json", exclude_unset=True),
        user_id=current_user.id if current_user else None,
    )

    return client

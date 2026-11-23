from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.modules.pedidos.models import Pedido


def ahora_utc() -> datetime:
    return datetime.now(timezone.utc)


class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, max_length=50)
    full_name: str = Field(max_length=100)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str
    role: str = Field(default="user", max_length=20)  # "user" | "admin"
    disabled: bool = Field(default=False)  # baja lógica
    created_at: datetime = Field(
        default_factory=ahora_utc, sa_type=DateTime(timezone=True)
    )

    # 1 usuario realiza 0..* pedidos
    pedidos: list["Pedido"] = Relationship(back_populates="usuario")

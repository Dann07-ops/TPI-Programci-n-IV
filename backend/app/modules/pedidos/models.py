from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.modules.productos.models import Producto
    from app.modules.usuarios.models import Usuario


def ahora_utc() -> datetime:
    return datetime.now(timezone.utc)


class EstadoPedido(str, Enum):
    PENDIENTE = "PENDIENTE"
    EN_PREPARACION = "EN_PREPARACION"
    ENTREGADO = "ENTREGADO"
    CANCELADO = "CANCELADO"


class FormaPago(str, Enum):
    EFECTIVO = "EFECTIVO"
    TRANSFERENCIA = "TRANSFERENCIA"


class Pedido(SQLModel, table=True):
    __tablename__ = "pedidos"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id", index=True)
    estado: str = Field(default=EstadoPedido.PENDIENTE.value, index=True, max_length=20)
    forma_pago: str = Field(max_length=20)  # EFECTIVO | TRANSFERENCIA
    direccion_entrega: str = Field(max_length=200)  # 5 a 200 caracteres
    notas: Optional[str] = Field(default=None)
    total: float = Field(default=0)  # suma de subtotales, fijo desde la creación
    created_at: datetime = Field(
        default_factory=ahora_utc, sa_type=DateTime(timezone=True)
    )
    updated_at: datetime = Field(
        default_factory=ahora_utc,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": ahora_utc},  # se actualiza solo en cada UPDATE
    )

    # N pedidos pertenecen a 1 usuario
    usuario: Optional["Usuario"] = Relationship(back_populates="pedidos")
    # Composición: 1 pedido contiene 1..* líneas que le pertenecen
    items: list["DetallePedido"] = Relationship(
        back_populates="pedido",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "order_by": "DetallePedido.id",
        },
    )


class DetallePedido(SQLModel, table=True):
    __tablename__ = "detalles_pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedidos.id", index=True)
    producto_id: int = Field(foreign_key="productos.id", index=True)
    cantidad: int  # >= 1, validado en schema
    # Copia del producto al momento de la compra (línea inmutable, RN-05)
    nombre_producto: str = Field(max_length=150)
    precio_unitario: float
    subtotal: float  # precio_unitario × cantidad

    pedido: Optional[Pedido] = Relationship(back_populates="items")
    producto: Optional["Producto"] = Relationship(back_populates="detalles")

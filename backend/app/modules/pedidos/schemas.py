from typing import Optional

from sqlmodel import Field, SQLModel

from app.core.types import FechaUTC
from app.modules.pedidos.models import EstadoPedido, FormaPago


# ---------- Entrada ----------
class ItemPedidoCreate(SQLModel):
    producto_id: int
    cantidad: int = Field(ge=1)


class PedidoCreate(SQLModel):
    items: list[ItemPedidoCreate] = Field(min_length=1)
    forma_pago: FormaPago  # solo EFECTIVO o TRANSFERENCIA (RN-06)
    direccion_entrega: str = Field(min_length=5, max_length=200)  # RN-06
    notas: Optional[str] = Field(default=None, max_length=500)


class CambioEstado(SQLModel):
    estado: EstadoPedido  # uno de los cuatro estados


# ---------- Salida ----------
class DetallePedidoRead(SQLModel):
    producto_id: int
    nombre_producto: str
    precio_unitario: float
    cantidad: int
    subtotal: float


class PedidoRead(SQLModel):
    id: int
    usuario_id: int
    estado: str
    forma_pago: str
    direccion_entrega: str
    notas: Optional[str]
    total: float
    created_at: FechaUTC
    updated_at: FechaUTC
    items: list[DetallePedidoRead]


class PedidosPaginados(SQLModel):
    total: int
    items: list[PedidoRead]


class ResumenPedidos(SQLModel):
    pendientes: int
    en_preparacion: int
    entregados: int
    cancelados: int
    pedidos_hoy: int
    ingresos_entregados: float

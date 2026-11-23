from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.modules.categorias.models import Categoria
    from app.modules.pedidos.models import DetallePedido


class Producto(SQLModel, table=True):
    __tablename__ = "productos"

    id: Optional[int] = Field(default=None, primary_key=True)
    categoria_id: int = Field(foreign_key="categorias.id", index=True)
    nombre: str = Field(index=True, max_length=150)
    descripcion: Optional[str] = Field(default=None)
    precio_base: float  # >= 0, validado en schema y Service
    imagen_url: Optional[str] = Field(default=None)
    stock: int = Field(default=0)  # >= 0, validado en schema y Service
    disponible: bool = Field(default=True)
    activo: bool = Field(default=True)  # baja lógica

    # N productos pertenecen a 1 categoría
    categoria: Optional["Categoria"] = Relationship(back_populates="productos")
    # 1 producto es referenciado en 0..* líneas de pedido
    detalles: list["DetallePedido"] = Relationship(back_populates="producto")

from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.modules.productos.models import Producto


class Categoria(SQLModel, table=True):
    __tablename__ = "categorias"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(unique=True, index=True, max_length=100)
    descripcion: Optional[str] = Field(default=None)
    activo: bool = Field(default=True)  # baja lógica

    # 1 categoría agrupa 0..* productos
    productos: list["Producto"] = Relationship(back_populates="categoria")

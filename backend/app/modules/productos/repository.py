from typing import Optional, Sequence

from sqlmodel import Session, col, func, select

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Producto)

    def get_by_id_for_update(self, id: int) -> Optional[Producto]:
        """Lee el producto bloqueando su fila hasta el fin de la transacción
        (SELECT ... FOR UPDATE). Si dos clientes compran el último producto
        al mismo tiempo, el segundo espera y luego ve el stock ya descontado.
        En PostgreSQL bloquea; SQLite lo ignora (ya serializa las escrituras)."""
        return self.session.exec(
            select(Producto).where(Producto.id == id).with_for_update()
        ).first()

    def search(
        self,
        search: Optional[str] = None,
        categoria_id: Optional[int] = None,
        disponible: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[int, Sequence[Producto]]:
        """Lista productos activos con filtros opcionales.
        Devuelve (total de coincidencias, página de resultados)."""
        statement = select(Producto).where(Producto.activo == True)  # noqa: E712
        if search:
            # ilike = LIKE sin distinguir mayúsculas
            statement = statement.where(col(Producto.nombre).ilike(f"%{search}%"))
        if categoria_id is not None:
            statement = statement.where(Producto.categoria_id == categoria_id)
        if disponible is not None:
            statement = statement.where(Producto.disponible == disponible)

        total = self.session.exec(
            select(func.count()).select_from(statement.subquery())
        ).one()
        items = self.session.exec(
            statement.order_by(Producto.id).offset(skip).limit(limit)
        ).all()
        return total, items

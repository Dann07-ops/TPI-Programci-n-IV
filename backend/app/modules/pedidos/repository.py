from datetime import datetime
from typing import Optional, Sequence

from sqlmodel import Session, col, func, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import EstadoPedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Pedido)

    def list_by_usuario(
        self,
        usuario_id: Optional[int],
        estado: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[int, Sequence[Pedido]]:
        """Pedidos de un usuario (o de todos si usuario_id es None),
        con filtro opcional por estado. Más recientes primero.
        Devuelve (total, página)."""
        statement = select(Pedido)
        if usuario_id is not None:
            statement = statement.where(Pedido.usuario_id == usuario_id)
        if estado is not None:
            statement = statement.where(Pedido.estado == estado)

        total = self.session.exec(
            select(func.count()).select_from(statement.subquery())
        ).one()
        items = self.session.exec(
            statement.order_by(col(Pedido.created_at).desc(), col(Pedido.id).desc())
            .offset(skip)
            .limit(limit)
        ).all()
        return total, items

    def count_by_estado(self, estado: str) -> int:
        return self.session.exec(
            select(func.count()).select_from(Pedido).where(Pedido.estado == estado)
        ).one()

    def count_desde(self, desde: datetime) -> int:
        return self.session.exec(
            select(func.count()).select_from(Pedido).where(Pedido.created_at >= desde)
        ).one()

    def sum_total_entregados(self) -> float:
        resultado = self.session.exec(
            select(func.coalesce(func.sum(Pedido.total), 0)).where(
                Pedido.estado == EstadoPedido.ENTREGADO.value
            )
        ).one()
        return float(resultado)

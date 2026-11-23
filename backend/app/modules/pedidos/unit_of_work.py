from app.core.unit_of_work import UnitOfWork
from app.modules.pedidos.repository import PedidoRepository
from app.modules.productos.repository import ProductoRepository


class PedidoUnitOfWork(UnitOfWork):
    """Pedidos y productos comparten la MISMA sesión: así crear el pedido,
    descontar el stock y crear las líneas es una sola transacción (RN-01)."""

    pedidos: PedidoRepository
    productos: ProductoRepository

    def _crear_repositorios(self) -> None:
        self.pedidos = PedidoRepository(self.session)
        self.productos = ProductoRepository(self.session)

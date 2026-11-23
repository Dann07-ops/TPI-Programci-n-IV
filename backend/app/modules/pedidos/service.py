from datetime import datetime, timezone
from typing import Optional

from app.modules.pedidos.models import DetallePedido, EstadoPedido, Pedido
from app.modules.pedidos.schemas import (
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.usuarios.schemas import UserPublic


# ---------- Excepciones de dominio ----------
class PedidoNoEncontrado(Exception):  # -> 404
    pass


class ProductoNoEncontrado(Exception):  # -> 404
    pass


class PedidoAjeno(Exception):  # -> 403
    pass


class ReglaDeNegocio(Exception):  # -> 400 (base de las reglas que fallan)
    pass


class StockInsuficiente(ReglaDeNegocio):
    pass


class ProductoNoDisponible(ReglaDeNegocio):
    pass


class ProductoRepetido(ReglaDeNegocio):
    pass


class TransicionInvalida(ReglaDeNegocio):
    pass


# ---------- Máquina de estados (RN-02) ----------
E = EstadoPedido
TRANSICIONES: dict[EstadoPedido, set[EstadoPedido]] = {
    E.PENDIENTE: {E.EN_PREPARACION, E.CANCELADO},
    E.EN_PREPARACION: {E.ENTREGADO, E.CANCELADO},
    E.ENTREGADO: set(),  # terminal
    E.CANCELADO: set(),  # terminal
}


def es_admin(usuario: UserPublic) -> bool:
    return usuario.role == "admin"


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    # ---------- RN-01: crear pedido ----------
    def crear(self, datos: PedidoCreate, usuario: UserPublic) -> PedidoRead:
        with self.uow as uow:
            ids = [item.producto_id for item in datos.items]
            if len(ids) != len(set(ids)):
                raise ProductoRepetido("Un producto no puede repetirse en el pedido")

            pedido = Pedido(
                usuario_id=usuario.id,
                estado=EstadoPedido.PENDIENTE.value,
                forma_pago=datos.forma_pago.value,
                direccion_entrega=datos.direccion_entrega.strip(),
                notas=datos.notas,
                total=0,
            )
            uow.pedidos.add(pedido)

            total = 0.0
            for item in datos.items:
                producto = uow.productos.get_by_id_for_update(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(
                        f"El producto {item.producto_id} no existe"
                    )
                if not producto.disponible:
                    raise ProductoNoDisponible(
                        f"'{producto.nombre}' no está disponible"
                    )
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(
                        f"Stock insuficiente de '{producto.nombre}': "
                        f"hay {producto.stock}, se pidieron {item.cantidad}"
                    )

                # Misma iteración: descontar stock y crear la línea con la copia
                producto.stock -= item.cantidad
                subtotal = round(producto.precio_base * item.cantidad, 2)
                pedido.items.append(
                    DetallePedido(
                        producto_id=producto.id,
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,
                        precio_unitario=producto.precio_base,
                        subtotal=subtotal,
                    )
                )
                total += subtotal

            pedido.total = round(total, 2)
            uow.pedidos.add(pedido)
            return PedidoRead.model_validate(pedido)
        # Si cualquier validación lanzó una excepción, el __exit__ del UoW
        # hace rollback: no queda ni el pedido ni el descuento de stock.

    # ---------- Consultas (RN-04) ----------
    def listar(
        self,
        usuario: UserPublic,
        estado: Optional[EstadoPedido],
        skip: int,
        limit: int,
    ) -> PedidosPaginados:
        with self.uow as uow:
            total, pedidos = uow.pedidos.list_by_usuario(
                usuario_id=None if es_admin(usuario) else usuario.id,
                estado=estado.value if estado else None,
                skip=skip,
                limit=limit,
            )
            return PedidosPaginados(
                total=total, items=[PedidoRead.model_validate(p) for p in pedidos]
            )

    def obtener(self, pedido_id: int, usuario: UserPublic) -> PedidoRead:
        with self.uow as uow:
            pedido = self._get(uow, pedido_id)
            if not es_admin(usuario) and pedido.usuario_id != usuario.id:
                raise PedidoAjeno("No tiene permiso para ver este pedido")
            return PedidoRead.model_validate(pedido)

    # ---------- RN-02 / RN-03: cambio de estado (admin) ----------
    def cambiar_estado(self, pedido_id: int, nuevo: EstadoPedido) -> PedidoRead:
        with self.uow as uow:
            pedido = self._get(uow, pedido_id)
            self._transicionar(uow, pedido, nuevo)
            return PedidoRead.model_validate(pedido)

    # ---------- RN-03 / RN-04: cancelación por el dueño ----------
    def cancelar(self, pedido_id: int, usuario: UserPublic) -> PedidoRead:
        with self.uow as uow:
            pedido = self._get(uow, pedido_id)
            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno("No puede cancelar un pedido de otro usuario")
            if pedido.estado != EstadoPedido.PENDIENTE.value:
                raise TransicionInvalida(
                    "Solo se pueden cancelar pedidos en estado PENDIENTE"
                )
            self._transicionar(uow, pedido, EstadoPedido.CANCELADO)
            return PedidoRead.model_validate(pedido)

    # ---------- Resumen del panel ----------
    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            return ResumenPedidos(
                pendientes=uow.pedidos.count_by_estado(E.PENDIENTE.value),
                en_preparacion=uow.pedidos.count_by_estado(E.EN_PREPARACION.value),
                entregados=uow.pedidos.count_by_estado(E.ENTREGADO.value),
                cancelados=uow.pedidos.count_by_estado(E.CANCELADO.value),
                pedidos_hoy=uow.pedidos.count_desde(inicio_del_dia_utc()),
                ingresos_entregados=round(uow.pedidos.sum_total_entregados(), 2),
            )

    # ---------- Ayudantes ----------
    @staticmethod
    def _get(uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
        pedido = uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado("Pedido no encontrado")
        return pedido

    @staticmethod
    def _transicionar(
        uow: PedidoUnitOfWork, pedido: Pedido, nuevo: EstadoPedido
    ) -> None:
        """Valida la transición ANTES de modificar el pedido. Si es una
        cancelación, restituye el stock en la misma transacción (RN-03)."""
        actual = EstadoPedido(pedido.estado)
        if nuevo not in TRANSICIONES[actual]:
            raise TransicionInvalida(
                f"Transición inválida: {actual.value} → {nuevo.value}"
            )

        if nuevo == EstadoPedido.CANCELADO:
            for linea in pedido.items:
                producto = uow.productos.get_by_id_for_update(linea.producto_id)
                if producto is not None:
                    producto.stock += linea.cantidad

        pedido.estado = nuevo.value
        uow.pedidos.add(pedido)


def inicio_del_dia_utc() -> datetime:
    """Medianoche de hoy en la hora local del servidor, expresada en UTC."""
    ahora_local = datetime.now().astimezone()
    medianoche = ahora_local.replace(hour=0, minute=0, second=0, microsecond=0)
    return medianoche.astimezone(timezone.utc)

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import AdminActual, UsuarioActivo
from app.modules.pedidos.models import EstadoPedido
from app.modules.pedidos.schemas import (
    CambioEstado,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.service import (
    PedidoAjeno,
    PedidoNoEncontrado,
    PedidoService,
    ProductoNoEncontrado,
    ReglaDeNegocio,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


def get_pedido_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork())


ServiceDep = Annotated[PedidoService, Depends(get_pedido_service)]


@router.post("", response_model=PedidoRead, status_code=status.HTTP_201_CREATED)
def crear_pedido(
    datos: PedidoCreate, usuario: UsuarioActivo, service: ServiceDep
) -> PedidoRead:
    try:
        return service.crear(datos, usuario)
    except ProductoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except ReglaDeNegocio as e:  # stock, no disponible, repetido
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=PedidosPaginados)
def listar_pedidos(
    usuario: UsuarioActivo,
    service: ServiceDep,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    estado: Optional[EstadoPedido] = None,
) -> PedidosPaginados:
    return service.listar(usuario, estado, skip, limit)


# Se declara ANTES de /{pedido_id}: si no, FastAPI intentaría
# interpretar "resumen" como un id y respondería 422.
@router.get("/resumen", response_model=ResumenPedidos)
def resumen_pedidos(_: AdminActual, service: ServiceDep) -> ResumenPedidos:
    return service.resumen()


@router.get("/{pedido_id}", response_model=PedidoRead)
def obtener_pedido(
    pedido_id: int, usuario: UsuarioActivo, service: ServiceDep
) -> PedidoRead:
    try:
        return service.obtener(pedido_id, usuario)
    except PedidoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except PedidoAjeno as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail=str(e))


@router.patch("/{pedido_id}/estado", response_model=PedidoRead)
def cambiar_estado_pedido(
    pedido_id: int, datos: CambioEstado, _: AdminActual, service: ServiceDep
) -> PedidoRead:
    try:
        return service.cambiar_estado(pedido_id, datos.estado)
    except PedidoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except ReglaDeNegocio as e:  # transición inválida
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{pedido_id}/cancelar", response_model=PedidoRead)
def cancelar_pedido(
    pedido_id: int, usuario: UsuarioActivo, service: ServiceDep
) -> PedidoRead:
    try:
        return service.cancelar(pedido_id, usuario)
    except PedidoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except PedidoAjeno as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail=str(e))
    except ReglaDeNegocio as e:  # no está en PENDIENTE
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))

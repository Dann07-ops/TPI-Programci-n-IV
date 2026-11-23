from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError

from app.core.deps import AdminActual
from app.modules.categorias.schemas import (
    CategoriaCreate,
    CategoriaRead,
    CategoriaUpdate,
)
from app.modules.categorias.service import (
    CategoriaNoEncontrada,
    CategoriaService,
    NombreDuplicado,
)
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork

router = APIRouter(prefix="/categorias", tags=["Categorías"])


def get_categoria_service() -> CategoriaService:
    return CategoriaService(CategoriaUnitOfWork())


ServiceDep = Annotated[CategoriaService, Depends(get_categoria_service)]

NOMBRE_DUPLICADO = "Ya existe una categoría con ese nombre"


@router.get("", response_model=list[CategoriaRead])
def listar_categorias(service: ServiceDep) -> list[CategoriaRead]:
    return service.listar_activas()


@router.get("/{categoria_id}", response_model=CategoriaRead)
def obtener_categoria(categoria_id: int, service: ServiceDep) -> CategoriaRead:
    try:
        return service.obtener(categoria_id)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
def crear_categoria(
    datos: CategoriaCreate, _: AdminActual, service: ServiceDep
) -> CategoriaRead:
    try:
        return service.crear(datos)
    except NombreDuplicado as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e))
    except IntegrityError:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=NOMBRE_DUPLICADO)


@router.put("/{categoria_id}", response_model=CategoriaRead)
def actualizar_categoria(
    categoria_id: int, datos: CategoriaUpdate, _: AdminActual, service: ServiceDep
) -> CategoriaRead:
    try:
        return service.actualizar(categoria_id, datos)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except NombreDuplicado as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e))
    except IntegrityError:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=NOMBRE_DUPLICADO)


@router.delete(
    "/{categoria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def eliminar_categoria(categoria_id: int, _: AdminActual, service: ServiceDep) -> None:
    try:
        service.eliminar(categoria_id)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))

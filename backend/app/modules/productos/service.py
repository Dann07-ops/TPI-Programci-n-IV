from typing import Any, Optional

from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


# ---- Excepciones de dominio ----
class ProductoNoEncontrado(Exception):
    pass


class CategoriaNoEncontrada(Exception):
    pass


class DatosInvalidos(Exception):
    pass


# Campos obligatorios en la tabla: un null explícito en el PUT se ignora
CAMPOS_OBLIGATORIOS = {"nombre", "precio_base", "stock", "disponible", "categoria_id"}


class ProductoService:
    def __init__(self, uow: ProductoUnitOfWork) -> None:
        self.uow = uow

    def listar(
        self,
        skip: int,
        limit: int,
        search: Optional[str],
        categoria_id: Optional[int],
        disponible: Optional[bool],
    ) -> ProductosPaginados:
        with self.uow as uow:
            total, productos = uow.productos.search(
                search=search.strip() if search else None,
                categoria_id=categoria_id,
                disponible=disponible,
                skip=skip,
                limit=limit,
            )
            return ProductosPaginados(
                total=total,
                items=[ProductoRead.model_validate(p) for p in productos],
            )

    def obtener(self, producto_id: int) -> ProductoRead:
        with self.uow as uow:
            return ProductoRead.model_validate(self._get_activo(uow, producto_id))

    def crear(self, datos: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            self._validar_categoria(uow, datos.categoria_id)
            self._validar_valores(datos.precio_base, datos.stock)
            producto = Producto(**datos.model_dump())
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def actualizar(self, producto_id: int, datos: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._get_activo(uow, producto_id)
            cambios: dict[str, Any] = {
                campo: valor
                for campo, valor in datos.model_dump(exclude_unset=True).items()
                if not (campo in CAMPOS_OBLIGATORIOS and valor is None)
            }
            if "categoria_id" in cambios:
                self._validar_categoria(uow, cambios["categoria_id"])
            self._validar_valores(
                cambios.get("precio_base", producto.precio_base),
                cambios.get("stock", producto.stock),
            )
            for campo, valor in cambios.items():
                setattr(producto, campo, valor)
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def actualizar_stock(
        self, producto_id: int, datos: ProductoStockUpdate
    ) -> ProductoRead:
        with self.uow as uow:
            producto = self._get_activo(uow, producto_id)
            self._validar_valores(producto.precio_base, datos.stock)
            producto.stock = datos.stock
            producto.disponible = datos.disponible
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def eliminar(self, producto_id: int) -> None:
        with self.uow as uow:
            producto = self._get_activo(uow, producto_id)
            producto.activo = False
            uow.productos.add(producto)

    # ---- Ayudantes ----
    @staticmethod
    def _get_activo(uow: ProductoUnitOfWork, producto_id: int) -> Producto:
        """Un producto dado de baja se trata como inexistente (404)."""
        producto = uow.productos.get_by_id(producto_id)
        if producto is None or not producto.activo:
            raise ProductoNoEncontrado("Producto no encontrado")
        return producto

    @staticmethod
    def _validar_categoria(uow: ProductoUnitOfWork, categoria_id: int) -> None:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada("La categoría no existe o está dada de baja")

    @staticmethod
    def _validar_valores(precio_base: float, stock: int) -> None:
        """Segunda barrera además del schema (el enunciado pide ambas)."""
        if precio_base < 0:
            raise DatosInvalidos("El precio no puede ser negativo")
        if stock < 0:
            raise DatosInvalidos("El stock no puede ser negativo")

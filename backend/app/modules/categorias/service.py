from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import (
    CategoriaCreate,
    CategoriaRead,
    CategoriaUpdate,
)
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


# ---- Excepciones de dominio ----
class CategoriaNoEncontrada(Exception):
    pass


class NombreDuplicado(Exception):
    pass


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork) -> None:
        self.uow = uow

    def listar_activas(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(c) for c in uow.categorias.list_activas()]

    def obtener(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            categoria = self._get_activa(uow, categoria_id)
            return CategoriaRead.model_validate(categoria)

    def crear(self, datos: CategoriaCreate) -> CategoriaRead:
        with self.uow as uow:
            nombre = datos.nombre.strip()
            # Se busca entre todas: la baja lógica no libera el nombre
            if uow.categorias.get_by_nombre(nombre):
                raise NombreDuplicado(f"Ya existe una categoría llamada '{nombre}'")
            categoria = Categoria(nombre=nombre, descripcion=datos.descripcion)
            uow.categorias.add(categoria)
            return CategoriaRead.model_validate(categoria)

    def actualizar(self, categoria_id: int, datos: CategoriaUpdate) -> CategoriaRead:
        with self.uow as uow:
            categoria = self._get_activa(uow, categoria_id)
            # exclude_unset: solo los campos que vinieron en el JSON
            cambios = datos.model_dump(exclude_unset=True)

            nuevo_nombre = cambios.get("nombre")
            if nuevo_nombre is not None:
                nuevo_nombre = nuevo_nombre.strip()
                otra = uow.categorias.get_by_nombre(nuevo_nombre)
                if otra is not None and otra.id != categoria.id:
                    raise NombreDuplicado(
                        f"Ya existe una categoría llamada '{nuevo_nombre}'"
                    )
                categoria.nombre = nuevo_nombre
            if "descripcion" in cambios:
                categoria.descripcion = cambios["descripcion"]

            uow.categorias.add(categoria)
            return CategoriaRead.model_validate(categoria)

    def eliminar(self, categoria_id: int) -> None:
        """Baja lógica. No toca sus productos (lo indica el enunciado)."""
        with self.uow as uow:
            categoria = self._get_activa(uow, categoria_id)
            categoria.activo = False
            uow.categorias.add(categoria)

    @staticmethod
    def _get_activa(uow: CategoriaUnitOfWork, categoria_id: int) -> Categoria:
        """Una categoría dada de baja se trata como inexistente (404)."""
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada("Categoría no encontrada")
        return categoria

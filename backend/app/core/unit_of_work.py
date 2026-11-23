from types import TracebackType
from typing import Callable, Optional, Self

from sqlmodel import Session

from app.core.database import session_factory


class UnitOfWork:
    """Abre una sesión, expone los repositorios y decide commit o rollback.

    Uso en un Service:
        with self.uow as uow:
            producto = uow.productos.get_by_id(1)
            ...
    Si el bloque termina sin excepción -> commit.
    Si se lanza cualquier excepción   -> rollback (no se guarda nada).
    En ambos casos la sesión se cierra.
    """

    def __init__(self, factory: Callable[[], Session] = session_factory) -> None:
        self._session_factory = factory
        self.session: Session

    def __enter__(self) -> Self:
        self.session = self._session_factory()
        self._crear_repositorios()
        return self

    def _crear_repositorios(self) -> None:
        """Cada UoW de módulo la sobrescribe para crear sus repositorios
        sobre la MISMA sesión (self.session)."""

    def __exit__(
        self,
        exc_type: Optional[type[BaseException]],
        exc: Optional[BaseException],
        tb: Optional[TracebackType],
    ) -> None:
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        except Exception:
            # Si falla el propio commit (por ejemplo, un UNIQUE violado),
            # se deshace todo y se propaga el error.
            self.session.rollback()
            raise
        finally:
            self.session.close()
        # Al devolver None (falsy), la excepción original sigue su camino
        # hasta el Router, que la traduce a un código HTTP.

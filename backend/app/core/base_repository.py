from typing import Generic, Optional, Sequence, TypeVar

from sqlmodel import Session, SQLModel, select

T = TypeVar("T", bound=SQLModel)


class BaseRepository(Generic[T]):
    """Operaciones comunes a todas las tablas. Sin reglas de negocio.

    T es el modelo con el que trabaja el repositorio (Usuario, Producto, etc.).
    No hace commit: solo add/flush. El commit lo decide el Unit of Work.
    """

    def __init__(self, session: Session, model: type[T]) -> None:
        self.session = session
        self.model = model

    def get_by_id(self, id: int) -> Optional[T]:
        return self.session.get(self.model, id)

    def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[T]:
        statement = select(self.model).offset(skip).limit(limit)
        return self.session.exec(statement).all()

    def add(self, entity: T) -> T:
        self.session.add(entity)
        # flush envía el INSERT/UPDATE a la base dentro de la transacción abierta
        # (así la entidad obtiene su id) pero NO confirma: eso es tarea del UoW.
        self.session.flush()
        self.session.refresh(entity)
        return entity

    def delete(self, entity: T) -> None:
        self.session.delete(entity)
        self.session.flush()

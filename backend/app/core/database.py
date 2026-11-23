from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# SQLite necesita este parámetro porque FastAPI atiende peticiones en varios hilos.
# PostgreSQL no lo usa, así que solo se agrega cuando la URL es de SQLite.
connect_args = (
    {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

engine = create_engine(settings.DATABASE_URL, echo=False, connect_args=connect_args)


def create_all_tables() -> None:
    """Crea las tablas de todos los modelos registrados en SQLModel.metadata."""
    # Se importan los modelos para que SQLModel conozca todas las tablas.
    from app.modules.usuarios import models as _usuarios  # noqa: F401
    from app.modules.categorias import models as _categorias  # noqa: F401
    from app.modules.productos import models as _productos  # noqa: F401
    from app.modules.pedidos import models as _pedidos  # noqa: F401

    SQLModel.metadata.create_all(engine)


def session_factory() -> Session:
    """Crea una sesión nueva. La usa el Unit of Work en __enter__."""
    return Session(engine)

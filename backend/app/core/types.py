from datetime import datetime, timezone
from typing import Annotated

from pydantic import AfterValidator


def _asegurar_utc(valor: datetime) -> datetime:
    """SQLite devuelve las fechas sin zona horaria. Como siempre se guardan
    en UTC, se la agregamos para que el JSON salga con '+00:00' y el
    frontend las convierta bien a la hora local."""
    if valor.tzinfo is None:
        return valor.replace(tzinfo=timezone.utc)
    return valor


FechaUTC = Annotated[datetime, AfterValidator(_asegurar_utc)]

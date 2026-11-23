from pydantic import EmailStr
from sqlmodel import Field, SQLModel

from app.core.types import FechaUTC


class UserCreate(SQLModel):
    username: str = Field(min_length=3, max_length=50)
    full_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    # bcrypt solo usa los primeros 72 bytes, por eso el máximo
    password: str = Field(min_length=8, max_length=72)


class UserPublic(SQLModel):
    """Lo que se expone de un usuario. Nunca incluye hashed_password."""

    id: int
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool
    created_at: FechaUTC

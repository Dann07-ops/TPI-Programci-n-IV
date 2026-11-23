from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.deps import UsuarioActivo
from app.modules.auth.schemas import MensajeResponse
from app.modules.auth.service import (
    AuthService,
    CredencialesInvalidas,
    CuentaDesactivada,
    UsuarioDuplicado,
)
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/auth", tags=["Auth"])

COOKIE_NAME = "access_token"


def get_auth_service() -> AuthService:
    return AuthService(UsuarioUnitOfWork())


ServiceDep = Annotated[AuthService, Depends(get_auth_service)]


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(datos: UserCreate, service: ServiceDep) -> UserPublic:
    try:
        return service.registrar(datos)
    except UsuarioDuplicado as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e))
    except IntegrityError:
        # Dos registros simultáneos con el mismo dato: lo frena el UNIQUE de la base
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="El usuario o el email ya están registrados"
        )


@router.post("/token", response_model=MensajeResponse)
def login(
    response: Response,
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: ServiceDep,
) -> MensajeResponse:
    try:
        token = service.login(form.username, form.password)
    except CredencialesInvalidas as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except CuentaDesactivada as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))

    # El token viaja SOLO en la cookie HttpOnly: JavaScript no puede leerla.
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,  # en producción con HTTPS va True
        path="/",
    )
    return MensajeResponse(message="Login exitoso")


@router.post("/logout", response_model=MensajeResponse)
def logout(response: Response) -> MensajeResponse:
    response.delete_cookie(key=COOKIE_NAME, path="/", httponly=True, samesite="lax")
    return MensajeResponse(message="Sesión cerrada")


@router.get("/me", response_model=UserPublic)
def me(usuario: UsuarioActivo) -> UserPublic:
    return usuario

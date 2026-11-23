from typing import Annotated, Callable, Optional

from fastapi import Cookie, Depends, HTTPException, status

from app.core.security import decode_access_token
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

CUENTA_DESACTIVADA = "Cuenta de usuario desactivada"


def get_current_user(
    access_token: Annotated[Optional[str], Cookie()] = None,
) -> UserPublic:
    """Lee el JWT de la cookie HttpOnly, valida firma y expiración
    y carga el usuario. 401 si no hay sesión válida."""
    no_autenticado = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado o sesión expirada",
    )
    if not access_token:
        raise no_autenticado

    payload = decode_access_token(access_token)
    if payload is None or not isinstance(payload.get("sub"), str):
        raise no_autenticado

    with UsuarioUnitOfWork() as uow:
        usuario = uow.usuarios.get_by_username(payload["sub"])
        if usuario is None:
            raise no_autenticado
        return UserPublic.model_validate(usuario)


def get_current_active_user(
    usuario: Annotated[UserPublic, Depends(get_current_user)],
) -> UserPublic:
    """Rechaza a los usuarios dados de baja (disabled = true) con 400."""
    if usuario.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=CUENTA_DESACTIVADA
        )
    return usuario


def require_role(roles: list[str]) -> Callable[[UserPublic], UserPublic]:
    """Fábrica de dependencias: require_role(["admin"]) devuelve una
    dependencia que deja pasar solo a esos roles (403 si no)."""

    def verificar_rol(
        usuario: Annotated[UserPublic, Depends(get_current_active_user)],
    ) -> UserPublic:
        if usuario.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para realizar esta acción",
            )
        return usuario

    return verificar_rol


# Atajos para usar en los routers
UsuarioActivo = Annotated[UserPublic, Depends(get_current_active_user)]
AdminActual = Annotated[UserPublic, Depends(require_role(["admin"]))]

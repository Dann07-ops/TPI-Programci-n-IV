# Food Store — Sistema de pedidos de comida

Trabajo Práctico Integrador · **Programación IV** · Tecnicatura Universitaria en Programación a Distancia (UTN)

**Alumno:** Daniel Alfredo Oscar Alderete · Legajo 118814

- **Repositorio:** https://github.com/USUARIO/REPOSITORIO  <!-- reemplazar por la URL pública -->
- **Video de demostración:** https://LINK-AL-VIDEO  <!-- reemplazar por el link público -->

Aplicación web para un negocio de comidas. Los clientes se registran, recorren el catálogo, arman un carrito y confirman pedidos con dirección y forma de pago. El administrador gestiona categorías, productos, stock, pedidos y usuarios desde un panel.

---

## Requisitos

| Herramienta | Versión |
|---|---|
| Python | **3.11 a 3.13** (SQLModel 0.0.22 no funciona con 3.14) |
| PostgreSQL | 15 o superior (para desarrollo también se acepta SQLite) |
| Node.js | 20.19 o superior |
| pnpm | 9 o superior |

## Estructura

```
FoodStore/
├── README.md
├── backend/     API REST · FastAPI + SQLModel + PostgreSQL
└── frontend/    SPA · React + TypeScript + Vite + Tailwind
```

---

## Backend

### 1. Crear la base de datos (PostgreSQL)

```sql
CREATE DATABASE foodstore_db;
```

### 2. Instalación

Desde la carpeta `backend/`:

**Windows (PowerShell)**

```powershell
py -3.13 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

**Linux / macOS**

```bash
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Editar `.env` con el usuario y la contraseña de PostgreSQL (ver la tabla de variables).

### 3. Datos iniciales (seed)

```bash
python -m app.db.seed
```

Crea las tablas, el usuario administrador, 4 categorías y 10 productos con stock. Es **idempotente**: se puede ejecutar varias veces sin duplicar datos.

### 4. Ejecución

```bash
uvicorn app.main:app --reload
```

- API: http://localhost:8000/api/v1
- Documentación Swagger: http://localhost:8000/docs
- Documentación ReDoc: http://localhost:8000/redoc

### Variables de entorno (`backend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a la base | `postgresql://postgres:postgres@localhost:5432/foodstore_db` (o `sqlite:///./foodstore.db` para desarrollo) |
| `SECRET_KEY` | Clave para firmar el JWT (mínimo 32 caracteres) | `cambiar-esta-clave-de-al-menos-32-caracteres` |
| `ALGORITHM` | Algoritmo del JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token y de la cookie | `30` |
| `FRONTEND_ORIGIN` | Origen permitido en CORS | `http://localhost:5173` |

---

## Frontend

Desde la carpeta `frontend/`:

```bash
pnpm install
cp .env.example .env        # en Windows: copy .env.example .env
pnpm build                  # verifica los tipos y compila
pnpm dev
```

Abrir **http://localhost:5173**.

### Variables de entorno (`frontend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la API. Si falta el `.env`, se usa este mismo valor por defecto | `http://localhost:8000/api/v1` |

> Vite lee el `.env` solo al arrancar: si se crea o modifica, hay que detener `pnpm dev` (Ctrl+C) y volver a ejecutarlo.

> **Importante:** usar `localhost` (no `127.0.0.1`) tanto en el navegador como en las variables, para que la cookie de sesión se comparta entre el frontend y el backend.

### Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| `SECRET_KEY Field required` al iniciar el backend | Falta `backend/.env`: copiar `.env.example` como `.env`. |
| `UnicodeDecodeError: 'utf-8' codec can't decode byte…` al ejecutar el seed | PostgreSQL rechazó la conexión y su mensaje en español no se pudo mostrar. Verificar que exista la base `foodstore_db` y que usuario y contraseña de `DATABASE_URL` sean correctos. |
| `ERR_PNPM_EISDIR … symlink` en `pnpm install` | El disco no admite enlaces simbólicos (exFAT/FAT32, típico de discos externos). Borrar `node_modules` y ejecutar `pnpm install --config.node-linker=hoisted`, o mover el proyecto a un disco NTFS. |

---

## Usuario administrador (seed)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin1234!` | admin |

Los clientes (rol `user`) se crean desde la pantalla de registro.

---

## Arquitectura

### Backend — capas por módulo

`Router → Service → Unit of Work → Repository → Model`

- **Router:** HTTP. Valida con schemas, resuelve sesión y rol con `Depends` y traduce las excepciones de dominio a `HTTPException`.
- **Service:** reglas de negocio. Abre `with self.uow as uow:` y devuelve el schema de salida dentro del bloque.
- **Unit of Work:** abre la sesión en `__enter__` y hace `commit` / `rollback` / `close` en `__exit__`. Ningún Service ni Router llama a `session.commit()`.
- **Repository:** consultas con `select`, hereda de `BaseRepository[T]`. Sin reglas de negocio.

Módulos: `auth`, `usuarios`, `categorias`, `productos`, `pedidos`. Infraestructura compartida en `app/core/`.

### Autenticación

- Login con formulario OAuth2 (`POST /auth/token`). El JWT viaja **solo** en la cookie `access_token` (HttpOnly, SameSite=Lax, 30 minutos). El frontend nunca lee ni guarda el token.
- Dependencias: `get_current_user` (lee la cookie) → `get_current_active_user` (rechaza `disabled`) → `require_role(["admin"])`.
- Contraseñas con hash bcrypt.

### Reglas de negocio de pedidos

- **RN-01:** creación transaccional. Por cada ítem se verifica, se descuenta el stock y se crea la línea con copia de nombre y precio. Si algo falla, no se guarda nada. La fila del producto se bloquea con `SELECT … FOR UPDATE` para evitar vender stock inexistente con compras simultáneas.
- **RN-02:** máquina de estados `PENDIENTE → EN_PREPARACION → ENTREGADO`, con cancelación desde los dos primeros. Los estados terminales no admiten cambios.
- **RN-03:** al cancelar se restituye el stock en la misma transacción.
- **RN-04:** el cliente ve y cancela solo sus pedidos (y solo en `PENDIENTE`); el admin ve todos.
- **RN-05:** las líneas y el total no cambian después de creados.
- **RN-06:** `forma_pago` ∈ {EFECTIVO, TRANSFERENCIA}; `direccion_entrega` de 5 a 200 caracteres.

### Frontend — organización por features

```
src/
├── shared/      api (Axios, errores, QueryClient), ui, components, layout, utils
├── features/    auth · categorias · productos · usuarios · pedidos
│                (cada una con pages, components, hooks, api y types)
├── store/       authStore y cartStore (Zustand + persist)
└── routes/      AppRouter y ProtectedRoute
```

- **Estado del servidor:** TanStack Query (`useQuery`, `useMutation` e invalidación).
- **Estado del cliente:** Zustand. `authStore` persiste solo el usuario (`partialize`) y `cartStore` persiste el carrito.
- **HTTP:** una instancia de Axios con `withCredentials` y un interceptor que limpia la sesión ante 401 o cuenta desactivada.
- **Rutas:** `ProtectedRoute` redirige a `/login` sin sesión y a `/unauthorized` sin el rol.
- TypeScript con `strict: true` y sin `any`.

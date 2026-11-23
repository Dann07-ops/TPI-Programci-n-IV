"""Carga inicial de datos. Idempotente: se puede ejecutar varias veces
sin duplicar nada (antes de crear cada registro, verifica si ya existe).

Uso (desde la carpeta backend/):  python -m app.db.seed
"""

from sqlmodel import Session, select

from app.core.database import create_all_tables, engine
from app.core.security import hash_password
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

ADMIN = {
    "username": "admin",
    "full_name": "Administrador Food Store",
    "email": "admin@foodstore.com",
    "password": "Admin1234!",
}

CATEGORIAS = [
    ("Pizzas", "Pizzas a la piedra y al molde"),
    ("Hamburguesas", "Hamburguesas caseras con papas"),
    ("Bebidas", "Gaseosas, aguas y cervezas"),
    ("Postres", "Dulces para terminar la comida"),
]

# (nombre, descripcion, precio, stock, categoria)
PRODUCTOS = [
    ("Pizza Muzzarella", "Salsa de tomate, muzzarella y aceitunas", 9500, 20, "Pizzas"),
    ("Pizza Napolitana", "Muzzarella, tomate en rodajas y ajo", 11000, 15, "Pizzas"),
    ("Pizza Fugazzeta", "Rellena de muzzarella con cebolla", 12500, 10, "Pizzas"),
    ("Hamburguesa Clásica", "Carne, lechuga, tomate y queso", 8500, 25, "Hamburguesas"),
    ("Hamburguesa Doble Bacon", "Doble carne, cheddar y panceta", 11500, 12, "Hamburguesas"),
    ("Hamburguesa Veggie", "Medallón de lentejas y vegetales", 9000, 8, "Hamburguesas"),
    ("Coca-Cola 1.5 L", "Gaseosa línea Coca-Cola", 3500, 40, "Bebidas"),
    ("Agua mineral 500 ml", "Sin gas", 1500, 50, "Bebidas"),
    ("Cerveza artesanal 1 L", "Rubia, estilo Golden Ale", 5000, 18, "Bebidas"),
    ("Flan casero", "Con dulce de leche y crema", 4000, 10, "Postres"),
]


def imagen_placeholder(nombre: str) -> str:
    texto = nombre.replace(" ", "+")
    return f"https://placehold.co/400x300/orange/white?text={texto}"


def seed() -> None:
    create_all_tables()
    with Session(engine) as session:
        # --- Usuario admin ---
        admin = session.exec(
            select(Usuario).where(Usuario.username == ADMIN["username"])
        ).first()
        if admin is None:
            session.add(
                Usuario(
                    username=ADMIN["username"],
                    full_name=ADMIN["full_name"],
                    email=ADMIN["email"],
                    hashed_password=hash_password(ADMIN["password"]),
                    role="admin",
                )
            )
            print("Usuario admin creado")
        else:
            print("Usuario admin ya existía")

        # --- Categorías ---
        categorias: dict[str, Categoria] = {}
        for nombre, descripcion in CATEGORIAS:
            categoria = session.exec(
                select(Categoria).where(Categoria.nombre == nombre)
            ).first()
            if categoria is None:
                categoria = Categoria(nombre=nombre, descripcion=descripcion)
                session.add(categoria)
                session.flush()  # para obtener su id
                print(f"Categoría creada: {nombre}")
            categorias[nombre] = categoria

        # --- Productos ---
        for nombre, descripcion, precio, stock, nombre_categoria in PRODUCTOS:
            existe = session.exec(select(Producto).where(Producto.nombre == nombre)).first()
            if existe is None:
                categoria = categorias[nombre_categoria]
                assert categoria.id is not None
                session.add(
                    Producto(
                        nombre=nombre,
                        descripcion=descripcion,
                        precio_base=precio,
                        stock=stock,
                        imagen_url=imagen_placeholder(nombre),
                        categoria_id=categoria.id,
                    )
                )
                print(f"Producto creado: {nombre}")

        session.commit()
    print("Seed finalizado")


if __name__ == "__main__":
    seed()

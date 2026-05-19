# SaludCaribe Shop

Sistema de gestión de inventario y pedidos para **SaludCaribe**, diseñado para administrar insumos médicos, odontológicos, de enfermería, aseo y papelería. Incluye panel de administración completo, carrito de compras y seguimiento de pedidos.

---

## Tabla de contenidos

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Credenciales de acceso](#credenciales-de-acceso)
- [Roles del sistema](#roles-del-sistema)
- [Endpoints principales de la API](#endpoints-principales-de-la-api)
- [Variables de entorno](#variables-de-entorno)

---

## Características

- **Autenticación JWT** — acceso seguro con tokens de acceso (24 h) y refresco (7 días)
- **Panel de administración** — gestión completa de productos, categorías, usuarios y pedidos
- **Catálogo de productos** — búsqueda por nombre/categoría, filtro por disponibilidad
- **Carrito de compras** — agregar, actualizar cantidad y eliminar ítems
- **Gestión de pedidos** — historial personal y vista global para administradores
- **Subida de imágenes** — carga de imágenes de productos desde el equipo local
- **Exportación a Excel** — exportar listado de productos con un clic
- **Control de roles** — 7 roles configurables por el administrador
- **Datos de muestra** — 5 categorías y 20 productos precargados al iniciar
- **Almacenamiento en memoria** — sin base de datos externa; ideal para desarrollo y demo

---

## Stack tecnológico

### Backend
| Tecnología | Versión |
|---|---|
| Java | 21 |
| Spring Boot | 3.2.5 |
| Spring Security | 6.x |
| JWT (jjwt) | 0.11.5 |
| Lombok | 1.18.32 |
| Maven | 3.x |

### Frontend
| Tecnología | Versión |
|---|---|
| React | 19 |
| Vite | 7 |
| TypeScript | 5.8 |
| TanStack Router | 1.x |
| Tailwind CSS | 4 |
| shadcn/ui | — |
| Axios | 1.7 |
| SheetJS (xlsx) | 0.18 |

---

## Estructura del proyecto

```
SALUDCARIBE-SHOP/
├── backend/                        # API REST Spring Boot
│   ├── src/main/java/com/saludcaribe/shop/
│   │   ├── config/                 # SecurityConfig, CorsConfig, DataInitializer
│   │   ├── controller/             # AuthController, ProductController, OrderController…
│   │   ├── dto/                    # Request/Response DTOs
│   │   ├── model/                  # User, Product, Category, Cart, Order, AppRole
│   │   ├── repository/             # Repositorios en memoria (ConcurrentHashMap)
│   │   ├── security/               # JwtAuthenticationFilter, JwtService, UserDetailsServiceImpl
│   │   └── service/                # AuthService, ProductService, CartService, OrderService…
│   └── src/main/resources/
│       └── application.properties
└── frontend/                       # SPA React + Vite
    └── src/
        ├── api/                    # Clientes HTTP (auth, products, categories, cart, orders, users)
        ├── components/             # Header, componentes UI (shadcn)
        ├── lib/                    # auth-context, cart-context, utils
        └── routes/                 # Páginas (TanStack Router file-based routing)
            ├── index.tsx           # Inicio / vitrina
            ├── productos.tsx       # Catálogo público
            ├── carrito.tsx         # Carrito de compras
            ├── pedidos.*.tsx       # Historial de pedidos
            ├── auth.tsx            # Login
            └── admin.*.tsx         # Panel de administración
```

---

## Requisitos previos

- **Java 21** (JDK)
- **Maven 3.8+**
- **Node.js 18+**
- **npm** (incluido con Node.js)

---

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/Luistorres1221/SALUDCARIBE-SHOP.git
cd SALUDCARIBE-SHOP
```

### 2. Iniciar el backend

```bash
cd backend
mvn spring-boot:run
```

El servidor arranca en `http://localhost:8080`.  
Al iniciar por primera vez se cargan automáticamente:
- Usuario administrador
- 5 categorías
- 20 productos de muestra con imágenes

### 3. Iniciar el frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

> El frontend tiene un proxy de Vite configurado: todas las peticiones a `/api` se redirigen automáticamente a `http://localhost:8080`.

---

## Credenciales de acceso

| Campo | Valor |
|---|---|
| **Email** | `admin@saludcaribe.com` |
| **Contraseña** | `Admin1234!` |
| **Rol** | Administrador |

> Solo el administrador puede crear nuevos usuarios y asignarles roles. El auto-registro público está deshabilitado.

---

## Roles del sistema

| Rol | Descripción |
|---|---|
| `admin` | Acceso completo al panel de administración |
| `medico` | Personal médico |
| `odontologia` | Auxiliar de odontología |
| `enfermeria` | Personal de enfermería |
| `administrativo` | Personal administrativo |
| `aseo` | Personal de aseo |
| `papeleria` | Personal de papelería |

---

## Endpoints principales de la API

### Autenticación
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/login` | Público | Iniciar sesión |
| `POST` | `/api/auth/register` | Admin | Crear usuario |

### Productos
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/products` | Público | Listar productos activos |
| `GET` | `/api/products/{id}` | Público | Detalle de producto |
| `GET` | `/api/products/admin` | Admin | Listar todos (incluye inactivos) |
| `POST` | `/api/products` | Admin | Crear producto |
| `PUT` | `/api/products/{id}` | Admin | Actualizar producto |
| `DELETE` | `/api/products/{id}` | Admin | Desactivar producto |

### Categorías
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/categories` | Público | Listar categorías |
| `POST` | `/api/categories` | Admin | Crear categoría |

### Carrito
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/cart` | Autenticado | Ver carrito |
| `POST` | `/api/cart/items` | Autenticado | Agregar ítem |
| `PUT` | `/api/cart/items/{id}` | Autenticado | Actualizar cantidad |
| `DELETE` | `/api/cart/items/{id}` | Autenticado | Eliminar ítem |

### Pedidos
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/orders` | Admin | Todos los pedidos |
| `GET` | `/api/orders/my` | Autenticado | Mis pedidos |
| `POST` | `/api/orders` | Autenticado | Crear pedido desde carrito |

### Archivos
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/uploads` | Autenticado | Subir imagen |
| `GET` | `/api/uploads/{filename}` | Público | Obtener imagen |

### Usuarios (Admin)
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/admin/users` | Admin | Listar usuarios |
| `POST` | `/api/admin/users/{id}/roles` | Admin | Asignar rol |
| `DELETE` | `/api/admin/users/{id}/roles/{role}` | Admin | Quitar rol |

---

## Variables de entorno

El backend se configura en `backend/src/main/resources/application.properties`:

```properties
server.port=8080

# JWT
app.jwt.secret=CAMBIA_ESTE_SECRETO_EN_PRODUCCION_MINIMO_256_BITS_32_CHARS_OK
app.jwt.expiration-ms=86400000
app.jwt.refresh-expiration-ms=604800000

# CORS
app.cors.allowed-origins=http://localhost:5173

# Subida de archivos
app.uploads.dir=./uploads
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

> En producción, cambia `app.jwt.secret` por una clave segura de al menos 32 caracteres.

---

## Notas de desarrollo

- **Almacenamiento en memoria**: todos los datos se pierden al reiniciar el backend. El `DataInitializer` recarga automáticamente los datos de muestra al arrancar.
- **Imágenes subidas**: se almacenan en `backend/uploads/` y se sirven en `/api/uploads/{filename}`.
- **Compatibilidad Lombok + Java 21**: se requiere Lombok ≥ 1.18.32. La versión está fijada en `pom.xml`.

---

## Licencia

Este proyecto es de uso interno para SaludCaribe. Todos los derechos reservados.

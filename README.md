# SaludCaribe Shop

Guia local de PostgreSQL y pgAdmin: [backend/POSTGRES-SETUP.md](backend/POSTGRES-SETUP.md).

Sistema de gestión de inventario y pedidos para **SaludCaribe**, diseñado para administrar insumos médicos, odontológicos, de enfermería, aseo y papelería. Incluye panel de administración completo, carrito de compras y seguimiento de pedidos.

> **Frontend:** https://saludcaribe-shop.vercel.app  
> **Backend API:** https://saludcaribe-shop.onrender.com

---

## Tabla de contenidos

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Ejecución local](#ejecución-local)
- [Despliegue en producción](#despliegue-en-producción)
  - [Backend en Render](#1-backend-en-render)
  - [Frontend en Vercel](#2-frontend-en-vercel)
- [Credenciales de acceso](#credenciales-de-acceso)
- [Roles del sistema](#roles-del-sistema)
- [Endpoints de la API](#endpoints-de-la-api)
- [Variables de entorno](#variables-de-entorno)

---

## Características

- **Autenticación JWT** — tokens de acceso (24 h) y refresco (7 días)
- **Panel de administración** — gestión completa de productos, categorías, usuarios y pedidos
- **Catálogo de productos** — búsqueda por nombre/categoría, filtro por disponibilidad
- **Carrito de compras** — agregar, actualizar cantidad y eliminar ítems
- **Gestión de pedidos** — historial personal y vista global para administradores
- **Subida de imágenes** — carga de imágenes desde el explorador de archivos
- **Exportación a Excel** — exportar listado de productos con un clic
- **Control de roles** — 7 roles configurables por el administrador
- **Datos de muestra** — 5 categorías y 20 productos precargados al iniciar
- **Persistencia JSON** — los datos se guardan en archivos JSON (sin base de datos externa)

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
| Maven | 3.9 |
| Docker | Multi-stage build |

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

---

## Estructura del proyecto

```
SALUDCARIBE-SHOP/
├── backend/
│   ├── Dockerfile                  # Imagen Docker multi-stage
│   ├── .dockerignore
│   ├── pom.xml
│   └── src/main/java/com/saludcaribe/shop/
│       ├── config/                 # SecurityConfig, CorsConfig, DataInitializer
│       ├── controller/             # AuthController, ProductController, ...
│       ├── dto/                    # Request/Response DTOs
│       ├── model/                  # User, Product, Category, Cart, Order, AppRole
│       ├── repository/             # Repositorios JPA sobre PostgreSQL
│       ├── security/               # JwtAuthenticationFilter, JwtService
│       └── service/                # AuthService, ProductService, CartService, ...
├── frontend/
│   ├── vercel.json                 # Configuración SPA routing para Vercel
│   └── src/
│       ├── api/                    # Clientes HTTP
│       ├── components/             # Header, UI (shadcn)
│       ├── lib/                    # auth-context, cart-context
│       └── routes/                 # Páginas (TanStack Router)
└── render.yaml                     # Configuración de despliegue en Render
```

---

## Ejecución local

La configuracion completa de PostgreSQL, pgAdmin y las tablas esta en [backend/POSTGRES-SETUP.md](backend/POSTGRES-SETUP.md).

Se necesita PostgreSQL Server local en ejecucion, ademas de pgAdmin. Configura la base y el perfil local antes de arrancar el backend:

```powershell
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

En otra terminal inicia el frontend con `cd frontend`, `npm install` y `npm run dev`.

---

## Despliegue en producción

### 1. Backend en Render

El backend está dockerizado con un `Dockerfile` multi-stage listo para Render.

#### Pasos:

1. Ve a [render.com](https://render.com) → **New** → **Web Service**
2. Conecta el repositorio `Luistorres1221/SALUDCARIBE-SHOP`
3. Configura el servicio:

| Campo | Valor |
|---|---|
| **Runtime** | `Docker` |
| **Dockerfile Path** | `./backend/Dockerfile` |
| **Docker Context** | `./backend` |
| **Plan** | Free |

4. Agrega las siguientes **variables de entorno** en Render:

| Variable | Valor |
|---|---|
| `JWT_SECRET` | Genera un valor seguro (mínimo 32 chars) |
| `CORS_ORIGINS` | URL de tu frontend en Vercel (ej: `https://saludcaribe-shop.vercel.app`) |
| `UPLOADS_DIR` | `/app/uploads` |

5. Haz clic en **Deploy**.

> PostgreSQL guarda los datos en la base administrada. Los archivos JSON heredados no se importan automaticamente.

---

### 2. Frontend en Vercel

#### Pasos:

1. Ve a [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Importa el repositorio `Luistorres1221/SALUDCARIBE-SHOP`
3. En **Configure Project**, establece:

| Campo | Valor |
|---|---|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite (auto-detectado) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. Agrega la **variable de entorno**:

| Variable | Valor |
|---|---|
| `VITE_API_BASE_URL` | URL de tu backend en Render (ej: `https://saludcaribe-shop.onrender.com`) |

5. Haz clic en **Deploy**.

> El archivo `frontend/vercel.json` ya incluye el rewrite necesario para que el enrutamiento SPA de TanStack Router funcione correctamente en Vercel.

---

### 3. Conectar frontend ↔ backend

Después de ambos despliegues:

1. Copia la URL del backend de Render (ej: `https://saludcaribe-shop.onrender.com`)
2. En Vercel → Settings → Environment Variables → actualiza `VITE_API_BASE_URL`
3. Copia la URL del frontend de Vercel (ej: `https://saludcaribe-shop.vercel.app`)
4. En Render → Environment → actualiza `CORS_ORIGINS`
5. Redespliega ambos servicios para que los cambios tomen efecto

---

## Credenciales de acceso

Configura el administrador local con `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD`. Usa una clave propia y cambiala despues del primer acceso.

| Campo | Valor |
|---|---|
| **Email** | `admin@saludcaribe.com` |
| **Contrasena** | La que configures en `BOOTSTRAP_ADMIN_PASSWORD` |
| **Rol** | Administrador |

Estas credenciales son solo para desarrollo local. En produccion configura `BOOTSTRAP_ADMIN_PASSWORD` como secreto antes del primer arranque de una base nueva. Si la cuenta ya existe, el inicializador no cambia su contrasena ni sus roles.

> Solo el administrador puede crear usuarios y asignar roles. El registro publico esta deshabilitado.

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

## Endpoints de la API

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
| `GET` | `/api/products/admin` | Admin | Todos (incluye inactivos) |
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

### Usuarios
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/admin/users` | Admin | Listar usuarios |
| `PUT` | `/api/admin/users/{id}` | Admin | Actualizar usuario |
| `POST` | `/api/admin/users/{id}/roles` | Admin | Asignar rol |
| `DELETE` | `/api/admin/users/{id}/roles/{role}` | Admin | Quitar rol |

---

## Variables de entorno

### Backend

| Variable | Local | Descripcion |
|---|---|---|
| `PORT` | `8080` | Puerto HTTP |
| `DB_HOST` | `localhost` | Host de PostgreSQL |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `DB_NAME` | `saludcaribe` | Nombre de la base |
| `DB_USER` | `saludcaribe_user` | Usuario de la aplicacion |
| `DB_PASSWORD` | Configuracion local ignorada por Git | Clave de PostgreSQL |
| `DDL_AUTO` | `update` | Actualiza el esquema JPA al iniciar |
| `BOOTSTRAP_ADMIN_EMAIL` | `admin@saludcaribe.com` | Correo usado solo si hay que crear el administrador |
| `BOOTSTRAP_ADMIN_PASSWORD` | Sin valor predeterminado | Sin valor, no crea una cuenta de administrador |
| `JWT_SECRET` | Clave de desarrollo | En produccion usa una clave segura de 32 caracteres o mas |
| `CORS_ORIGINS` | `http://localhost:5173` | Origen permitido para el frontend |
| `UPLOADS_DIR` | `./uploads` | Carpeta para archivos subidos |

Render configura las variables de PostgreSQL desde la base administrada. Configura `BOOTSTRAP_ADMIN_PASSWORD` como secreto antes del primer arranque de una base nueva.
### Frontend (Vite / Vercel)

| Variable | Default (dev) | Producción |
|---|---|---|
| `VITE_API_BASE_URL` | `""` (proxy Vite) | URL del backend en Render |

---

## Docker (local)

Si ejecutas el backend dentro de Docker y PostgreSQL esta instalado directamente en Windows, usa `host.docker.internal` como host:

```powershell
cd backend
docker build -t saludcaribe-backend .
docker run --rm -p 8080:8080 -e DB_HOST=host.docker.internal -e DB_PORT=5432 -e DB_NAME=saludcaribe -e DB_USER=saludcaribe_user -e DB_PASSWORD=CAMBIA_ESTA_CLAVE_DB -e BOOTSTRAP_ADMIN_PASSWORD=CAMBIA_ESTA_CLAVE_ADMIN -e JWT_SECRET=CAMBIA_ESTE_SECRETO_POR_UNO_DE_32_CARACTERES -e CORS_ORIGINS=http://localhost:5173 saludcaribe-backend
```

## Despliegue en AWS EC2

La receta de produccion con Docker Compose, HTTPS opcional por dominio y almacenamiento persistente EBS para PostgreSQL e imagenes esta en [EC2-DEPLOY.md](EC2-DEPLOY.md).

---
## Licencia

Uso interno para SaludCaribe. Todos los derechos reservados.

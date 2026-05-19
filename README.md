# SaludCaribe Shop

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
│       ├── repository/             # Repositorios con JsonFileStore (ConcurrentHashMap)
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

### Requisitos
- Java 21 (JDK)
- Maven 3.8+
- Node.js 18+

### 1. Backend

```bash
cd backend
mvn spring-boot:run
# API disponible en http://localhost:8080
```

Al iniciar por primera vez se cargan automáticamente 5 categorías y 20 productos de muestra.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App disponible en http://localhost:5173
```

> El proxy de Vite redirige `/api` → `http://localhost:8080` en desarrollo.

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
| `DATA_DIR` | `/app/data` |
| `UPLOADS_DIR` | `/app/uploads` |

5. Haz clic en **Deploy**.

> **Nota sobre persistencia:** En el plan gratuito de Render, el sistema de archivos es efímero. Los datos (JSON) y las imágenes subidas se perderán al reiniciar el servicio. El `DataInitializer` recargará los datos de muestra automáticamente. Para persistencia real, agrega un **Disk** en Render montado en `/app/data`.

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

| Campo | Valor |
|---|---|
| **Email** | `admin@saludcaribe.com` |
| **Contraseña** | `Admin1234!` |
| **Rol** | Administrador |

> Solo el administrador puede crear usuarios y asignar roles. El registro público está deshabilitado.

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

### Backend (`application.properties` / Render)

| Variable | Default (dev) | Producción |
|---|---|---|
| `PORT` | `8080` | Asignado por Render automáticamente |
| `JWT_SECRET` | `CAMBIA_ESTE_SECRETO...` | Clave segura ≥ 32 chars |
| `CORS_ORIGINS` | `http://localhost:5173` | URL de Vercel |
| `DATA_DIR` | `./data` | `/app/data` |
| `UPLOADS_DIR` | `./uploads` | `/app/uploads` |

### Frontend (Vite / Vercel)

| Variable | Default (dev) | Producción |
|---|---|---|
| `VITE_API_BASE_URL` | `""` (proxy Vite) | URL del backend en Render |

---

## Docker (local)

Para probar el backend dockerizado localmente:

```bash
cd backend
docker build -t saludcaribe-backend .
docker run -p 8080:8080 \
  -e JWT_SECRET=mi_secreto_seguro_de_al_menos_32_caracteres \
  -e CORS_ORIGINS=http://localhost:5173 \
  saludcaribe-backend
```

---

## Licencia

Uso interno para SaludCaribe. Todos los derechos reservados.

# Configuracion local de PostgreSQL con pgAdmin

El backend ya usa Spring Data JPA y el driver JDBC de PostgreSQL. Hibernate crea las tablas de la aplicacion al primer arranque.

## Requisitos

- PostgreSQL Server instalado y en ejecucion. pgAdmin es el cliente grafico, no el servidor.
- Java 21, Maven 3.8+ y pgAdmin 4.

## 1. Crear el usuario de la aplicacion

1. En pgAdmin registra/conecta el servidor local: host `localhost`, puerto `5433`, base de mantenimiento `postgres`, usuario administrador `postgres`.
2. Abre Query Tool sobre la base `postgres`.
3. Abre `backend/database/create-local-role.sql`, cambia `CAMBIA_ESTA_CLAVE_DB` por una clave local y ejecuta el SQL una sola vez.
4. En el arbol, clic derecho en **Databases > Create > Database**. Usa:
   - **Database:** `saludcaribe`
   - **Owner:** `saludcaribe_user`
   - **Encoding:** `UTF8`

El usuario de la aplicacion es propietario de esta base para que Hibernate pueda crear/actualizar sus tablas. No es superusuario.

## 2. Configurar y arrancar el backend

Copia `backend/src/main/resources/application-local.properties.example` a `backend/src/main/resources/application-local.properties`. En la copia, pon en `spring.datasource.password` la misma clave que usaste en el SQL. El archivo local real esta excluido de Git.

Desde la raiz del proyecto, ejecuta:

```powershell
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

En el primer arranque, Hibernate crea las tablas en el esquema `public` y se cargan las categorias, productos de muestra, bodegas y cargos. El administrador local se crea si el correo aun no existe. Los arranques posteriores no cambian su contrasena ni sus roles.

## 3. Verificar en pgAdmin

Registra otra conexion (o edita una existente) con host `localhost`, puerto `5433`, base de mantenimiento `saludcaribe`, usuario `saludcaribe_user` y la clave local. Abre **Databases > saludcaribe > Schemas > public > Tables** y actualiza el arbol.

Puedes confirmar la conexion en Query Tool:

```sql
SELECT current_database(), current_user;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

## 4. Iniciar el frontend

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. Vite envia las rutas `/api` al backend en `http://localhost:8080`.

Los archivos `backend/data/*.json` son datos heredados y no se importan automaticamente. Una base nueva recibe los datos de muestra del inicializador.

## Almacenamiento local de imagenes

Las imagenes de productos y categorias se guardan como archivos en backend/uploads. PostgreSQL conserva la URL del archivo en el registro del producto o categoria. No se requiere configurar Cloudinary. La carpeta backend/uploads esta excluida de Git.
## Acceso desde otros equipos de la red local

En el equipo que ejecuta el proyecto, inicia el backend en el puerto 8080 y el frontend con npm run dev. Vite escucha en todas las interfaces en el puerto 5173. Desde otro equipo conectado a la misma red, abre http://192.168.3.181:5173. Si Windows Defender Firewall pregunta, permite Node.js en redes privadas. Si no aparece el aviso y el navegador no conecta, crea una regla de entrada TCP para el puerto 5173 en el perfil Privado de Windows.

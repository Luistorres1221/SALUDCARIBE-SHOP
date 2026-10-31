# Despliegue de SaludCaribe Shop en AWS EC2

La configuracion publica React, la API Spring Boot y PostgreSQL con Docker Compose. PostgreSQL y las imagenes se guardan fuera de los contenedores en un volumen EBS montado en `/srv/caribeshop`. Caddy sirve la web, envia `/api/*` al backend y activa HTTPS automaticamente cuando se configura un dominio.

## 1. Crear la infraestructura en AWS

1. La instancia que ya creaste usa **Amazon Linux 2023 x86_64**. Puedes continuar con ella. Para construir las imagenes en la instancia, se recomiendan al menos 4 GiB de memoria; tu tipo actual `t3.micro` tiene menos memoria y puede quedarse sin recursos.
2. Crea un grupo de seguridad con estas reglas de entrada:
   - TCP 22 (SSH): solo tu IP publica.
   - TCP 80 y 443: cualquier IPv4; agrega las reglas IPv6 solo si vas a publicar por IPv6.
   - No abras 8080 ni 5432 a Internet.
3. Tu instancia ya tiene un volumen EBS raiz de 20 GiB. Para iniciar sin agregar otro recurso facturable, se puede usar una carpeta en ese disco para la base y las imagenes. Revisa el espacio libre con `df -h /` antes de construir. EBS conserva datos al reiniciar o detener/iniciar la instancia; al terminarla, AWS puede borrar el disco raiz si sigue habilitada la opcion de eliminacion. Consulta la [guia oficial de EBS](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-using-volumes.html). Un volumen EBS de datos separado se puede agregar despues si hace falta capacidad.
4. Si usaras un dominio, asigna una Elastic IP y crea un registro DNS tipo A que apunte a ella. Una IP publica efimera puede cambiar al detener e iniciar la instancia; AWS indica que Elastic IP proporciona una IPv4 persistente y que las IPv4 publicas tienen costo ([Elastic IP](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html)).

## 2. Preparar el almacenamiento en el EBS raiz existente

La instancia existente ya tiene un volumen EBS raiz de 20 GiB. **No ejecutes `mkfs` ni formatees `/dev/xvda`**. Despues de conectarte por SSH, comprueba el espacio y crea el directorio de datos:

```bash
df -h /
sudo mkdir -p /srv/caribeshop/postgres18 /srv/caribeshop/uploads
sudo chmod 755 /srv/caribeshop
```

En `.env` conserva `APP_DATA_DIR=/srv/caribeshop`. PostgreSQL 18 usa `/srv/caribeshop/postgres18` en el volumen EBS raiz; las imagenes quedan en `/srv/caribeshop/uploads`. Si la instancia ya se habia iniciado con PostgreSQL 16, su carpeta anterior `/srv/caribeshop/postgres` se conserva aparte y no se reutiliza ni se borra. PostgreSQL 18 cambio la ruta de montaje recomendada de la imagen oficial; por eso Compose monta la carpeta en `/var/lib/postgresql`. Revisa periodicamente `df -h /`; 20 GiB son el espacio compartido por el sistema, Docker, la base y las imagenes. No termines la instancia sin verificar que el volumen raiz no se eliminara o sin tener un backup. [Documentacion de la imagen oficial de PostgreSQL](https://hub.docker.com/_/postgres).

### Opcional: agregar otro volumen EBS mas adelante

Si el disco se queda sin espacio, adjunta un volumen EBS vacio en la misma zona de disponibilidad. Conectate y localiza cuidadosamente el disco nuevo:

```bash
lsblk -f
```

Identifica el disco EBS **vacio** (en Amazon Linux 2023 suele aparecer como `/dev/nvme1n1`; el nombre depende de la instancia). Solo para un volumen nuevo, vacio y verificado, inicializalo una vez:

```bash
sudo mkfs -t xfs /dev/nvme1n1
sudo mkdir -p /mnt/caribeshop-ebs
sudo mount /dev/nvme1n1 /mnt/caribeshop-ebs
sudo blkid /dev/nvme1n1
```

Copia el UUID que muestra `blkid` y agregalo a `/etc/fstab` (reemplaza `UUID_REAL`):

```bash
echo 'UUID=UUID_REAL /mnt/caribeshop-ebs xfs defaults,nofail 0 2' | sudo tee -a /etc/fstab
sudo mount -a
sudo mkdir -p /mnt/caribeshop-ebs/postgres /mnt/caribeshop-ebs/uploads
```

Confirma el montaje con `df -h /mnt/caribeshop-ebs` y luego cambia `APP_DATA_DIR=/mnt/caribeshop-ebs` en `.env`. No repitas `mkfs` sobre un volumen ya inicializado. AWS recomienda usar el UUID en `/etc/fstab`, ya que el nombre del dispositivo puede variar.


## 3. Instalar Docker y descargar el proyecto

En Amazon Linux 2023 instala Docker con DNF. AWS documenta estos pasos para AL2023 ([instalar Docker en AL2023](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-docker.html)):

Tu `t3.micro` tiene aproximadamente 1 GiB de RAM. Antes de construir, puedes agregar 2 GiB de swap en el disco EBS raiz existente (usa espacio de disco, no crea otro volumen AWS). La compilacion puede ser lenta y el swap no reemplaza RAM, pero reduce la probabilidad de que Linux finalice el compilador por falta de memoria:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
free -h
```

El Dockerfile del backend limita el heap de Java a 384 MiB para dejar memoria al sistema, PostgreSQL y Caddy.

```bash
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
```

Sal de la sesion SSH y vuelve a conectarte para que se aplique el grupo `docker`. Instala el plugin Compose oficial para Linux x86_64 ([instrucciones de Compose](https://docs.docker.com/compose/install/linux/)):

```bash
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/download/v5.6.0/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
sudo docker compose version
```

Clona el repositorio (ajusta la URL si usas otro remoto):

```bash
sudo mkdir -p /opt/saludcaribe
sudo chown "$USER":"$USER" /opt/saludcaribe
git clone https://github.com/Luistorres1221/SALUDCARIBE-SHOP.git /opt/saludcaribe
cd /opt/saludcaribe
```

## 4. Configurar secretos y dominio

```bash
cp .env.production.example .env
nano .env
```

En `.env`, cambia `DB_PASSWORD`, `JWT_SECRET` y `BOOTSTRAP_ADMIN_PASSWORD`. Genera valores aleatorios hexadecimales con:

```bash
openssl rand -hex 32
```

Usa un valor distinto para cada secreto; el JWT debe tener por lo menos 32 bytes. No subas `.env` a Git ni compartas esos valores. Conserva la clave temporal del administrador en un gestor seguro.

- **Sin dominio:** deja `SITE_ADDRESS=:80`. La aplicacion quedara en `http://IP_PUBLICA` sin HTTPS.
- **Con dominio:** cambia `SITE_ADDRESS` por el nombre DNS, por ejemplo `tienda.ejemplo.com`, apunta su DNS a la IP publica/Elastic IP y deja entrar TCP 80 y 443. Caddy solicitara y renovara el certificado TLS automaticamente.
- `APP_DATA_DIR=/srv/caribeshop` debe coincidir con el punto de montaje EBS.

El primer arranque crea las tablas, los datos de catalogo iniciales y el administrador definido en `.env`. El administrador solo se crea si ese correo aun no existe; cambiar luego `BOOTSTRAP_ADMIN_PASSWORD` no cambia una cuenta ya creada.

## 5. Construir y arrancar

```bash
cd /opt/saludcaribe
sudo docker compose config
sudo docker compose up -d --build
sudo docker compose ps
sudo docker compose logs -f backend
```

Verifica desde la instancia y desde tu navegador:

```bash
curl http://localhost/api/ping
```

Abre `http://IP_PUBLICA` o `https://tu-dominio`. Inicia sesion con `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD`; cambia la clave inicial despues del primer acceso.

## Donde quedan las imagenes y la base de datos

- Imagenes cargadas desde el panel: `/srv/caribeshop/uploads` en el volumen EBS. El backend las lee desde `/app/uploads` dentro del contenedor.
- Archivos de PostgreSQL 18: `/srv/caribeshop/postgres18` en ese mismo EBS.
- Caddy mantiene sus certificados en volumenes Docker.

Los contenedores se pueden reconstruir o reemplazar sin borrar esos directorios. Programa snapshots EBS y respaldos; EBS no sustituye un backup. Para escalar a varias instancias o separar los archivos del servidor, S3 es la alternativa recomendada: requeriria cambiar el backend para cargar y servir objetos desde S3. Esta configuracion deja las imagenes locales en EBS, sin necesitar Cloudinary.

## Actualizar la aplicacion

```bash
cd /opt/saludcaribe
git pull
sudo docker compose up -d --build
sudo docker image prune -f
```

No borres `/srv/caribeshop`. Para revisar errores, usa `sudo docker compose logs -f backend frontend db`.

## Limites de esta instalacion

- Esta receta usa una sola EC2 y un PostgreSQL dentro de Docker. El disco EBS persiste, pero EC2 sigue siendo un unico punto de falla; conserva snapshots/respaldos fuera de la instancia.
- `DDL_AUTO=update` permite inicializar el esquema y actualizarlo al arrancar. Haz un backup antes de actualizar la aplicacion; cuando gestiones cambios de esquema con migraciones, cambia a `validate`.
- La configuracion de correo no esta activada por defecto. Si el sistema necesita enviar correos, completa `MAIL_USERNAME` y `MAIL_PASSWORD` en `.env` con credenciales de SMTP.
- Para llevar a EC2 los productos, usuarios, pedidos e imagenes de la base local, hay que migrar la base y copiar `backend/uploads` por separado. Un despliegue nuevo no importa esos datos automaticamente.

# ⚙️ Configuración y ejecución del Backend

Este archivo explica cómo configurar correctamente las variables de entorno para ejecutar el backend en **development** o **production**.

---

# 📄 Archivo `.env`

Crea un archivo llamado:

```text
.env
```

con las siguientes variables:

```env
# =========================
# CONFIGURACIÓN DEL SERVIDOR
# =========================

SESSION_SECRET=cambia-esta-clave-en-produccion
PORT=5000

# development | production
NODE_ENV=development

# Clave utilizada por la API
API_KEY=tu_api_key


# =========================
# BASE DE DATOS
# =========================

# Se utiliza únicamente en producción
DATABASE_URL=link_de_conexion_a_la_base_de_datos


# Variables utilizadas en development
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=MiBaseDeDatos
DB_PASSWORD=admin123
DB_PORT=5432


# =========================
# POOL DE CONEXIONES
# =========================

DB_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONN_TIMEOUT=2000


# =========================
# SSL
# =========================

DB_SSL=false
```

---

# 🌱 Modo Development

Para ejecutar el backend en desarrollo:

```env
NODE_ENV=development
```

Cuando el backend está en modo **development**, utiliza las variables individuales de conexión:

```env
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=MiBaseDeDatos
DB_PASSWORD=admin123
DB_PORT=5432
```

En este modo:

```text
DATABASE_URL ❌ No se utiliza
```

La conexión se construye utilizando las variables individuales de PostgreSQL.

## Ejemplo

```env
NODE_ENV=development

DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=MiBaseDeDatos
DB_PASSWORD=admin123
DB_PORT=5432

DB_SSL=false
```

---

# 🚀 Modo Production

Para ejecutar el backend en producción:

```env
NODE_ENV=production
```

Cuando el backend está en modo **production**, utiliza:

```env
DATABASE_URL=link_de_conexion_a_la_base_de_datos
```

En este modo, la conexión principal se obtiene directamente desde `DATABASE_URL`.

Las variables individuales:

```text
DB_USER
DB_HOST
DB_DATABASE
DB_PASSWORD
DB_PORT
```

no son utilizadas para construir la conexión de producción.

## Ejemplo

```env
NODE_ENV=production

DATABASE_URL=postgresql://usuario:password@host:5432/base_de_datos

DB_SSL=true
```

---

# 🔀 Selección automática de configuración

La variable que determina qué configuración utilizar es:

```env
NODE_ENV
```

El comportamiento esperado es:

```text
NODE_ENV=development
        │
        ▼
Usar configuración local
        │
        ├── DB_USER
        ├── DB_HOST
        ├── DB_DATABASE
        ├── DB_PASSWORD
        └── DB_PORT


NODE_ENV=production
        │
        ▼
Usar DATABASE_URL
```

En resumen:

| NODE_ENV | Método de conexión |
|---|---|
| `development` | Variables individuales `DB_*` |
| `production` | `DATABASE_URL` |

---

# 🔐 Variables del servidor

## `SESSION_SECRET`

```env
SESSION_SECRET=cambia-esta-clave-en-produccion
```

Clave utilizada para la seguridad de las sesiones.

> ⚠️ En producción debe utilizarse una clave larga, aleatoria y privada.

---

## `PORT`

```env
PORT=5000
```

Puerto donde se ejecuta el backend.

Ejemplo:

```text
http://localhost:5000
```

---

## `NODE_ENV`

```env
NODE_ENV=development
```

Indica el entorno donde está ejecutándose el backend.

Valores utilizados:

```text
development
production
```

Esta variable determina qué configuración de base de datos utilizar.

---

## `API_KEY`

```env
API_KEY=tu_api_key
```

Clave utilizada por la API según la configuración del backend.

> ⚠️ No debe exponerse públicamente.

---

# 🗄️ Variables de Base de Datos

## `DATABASE_URL`

```env
DATABASE_URL=postgresql://usuario:password@host:5432/base_de_datos
```

Se utiliza en:

```text
production
```

Contiene toda la información necesaria para conectarse a la base de datos.

---

## `DB_USER`

```env
DB_USER=postgres
```

Usuario de PostgreSQL utilizado principalmente en desarrollo.

## `DB_HOST`

```env
DB_HOST=localhost
```

Servidor donde se encuentra PostgreSQL.

## `DB_DATABASE`

```env
DB_DATABASE=MiBaseDeDatos
```

Nombre de la base de datos.

## `DB_PASSWORD`

```env
DB_PASSWORD=admin123
```

Contraseña del usuario de la base de datos.

> ⚠️ Nunca publiques una contraseña real en un repositorio.

## `DB_PORT`

```env
DB_PORT=5432
```

Puerto de PostgreSQL.

---

# 🔄 Pool de conexiones

## `DB_MAX`

```env
DB_MAX=20
```

Cantidad máxima de conexiones permitidas en el pool.

## `DB_IDLE_TIMEOUT`

```env
DB_IDLE_TIMEOUT=30000
```

Tiempo máximo que una conexión puede permanecer inactiva antes de ser liberada.

## `DB_CONN_TIMEOUT`

```env
DB_CONN_TIMEOUT=2000
```

Tiempo máximo de espera para establecer una conexión.

---

# 🔒 SSL

## `DB_SSL`

```env
DB_SSL=false
```

Indica si la conexión a la base de datos debe utilizar SSL.

Valores:

```text
true
false
```

Ejemplo común:

### Development

```env
DB_SSL=false
```

### Production

```env
DB_SSL=true
```

La configuración final depende del proveedor donde esté alojada la base de datos.

---

# ▶️ Resumen rápido para ejecutar el backend

## Desarrollo local

```env
NODE_ENV=development
PORT=5000

DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=MiBaseDeDatos
DB_PASSWORD=admin123
DB_PORT=5432

DB_SSL=false
```

El backend utiliza:

```text
DB_USER
DB_HOST
DB_DATABASE
DB_PASSWORD
DB_PORT
```

---

## Producción

```env
NODE_ENV=production
PORT=5000

DATABASE_URL=postgresql://usuario:password@host:5432/base_de_datos

DB_SSL=true
```

El backend utiliza:

```text
DATABASE_URL
```

---

# 🧠 Regla principal

```text
Si NODE_ENV === "production"
    → usar DATABASE_URL

Si NODE_ENV === "development"
    → usar las variables DB_*
```

De esta manera, el mismo backend puede ejecutarse localmente con una configuración de PostgreSQL separada y utilizar una URL completa de conexión cuando se despliega en producción.

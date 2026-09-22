# 📋 Documentación — Lista de deseos

Este módulo administra las listas de deseos de los usuarios y los productos incluidos en ellas.

Una lista de deseos permite:

- Obtener o crear automáticamente la lista de un usuario.
- Consultar una lista mediante un token público para compartirla.
- Agregar productos a una lista.
- Actualizar la cantidad deseada de un producto.
- Eliminar productos de una lista.
- Marcar productos como comprados.
- Registrar el nombre de la persona que realizó la compra.

## Resumen de endpoints

| Método   | Endpoint                           |        Auth | Descripción                                     |
| -------- | ---------------------------------- | ----------: | ----------------------------------------------- |
| `GET`    | `/api/lista-deseos/`               |        Sí\* | Obtener o crear la lista de deseos del usuario. |
| `GET`    | `/api/lista-deseos/publica/:token` |          No | Consultar una lista mediante su token público.  |
| `POST`   | `/api/lista-deseos/item`           | Según lista | Agregar o actualizar un producto en la lista.   |
| `DELETE` | `/api/lista-deseos/item`           | Según lista | Eliminar un producto de la lista.               |
| `PUT`    | `/api/lista-deseos/item/comprado`  |  Según item | Marcar un producto como comprado.               |

> **Nota sobre autenticación:** las rutas no muestran `authMiddleware` directamente en el router proporcionado. Sin embargo, `GET /api/lista-deseos/` necesita un usuario autenticado porque el controlador obtiene el `usuario_id` desde `req.user` o `req.session.user`.

---

# Modelo de datos

El módulo utiliza principalmente las tablas:

```text
listas_deseos
lista_deseos_items
productos
```

## Lista de deseos

La lista pertenece a un usuario y dispone de un token para compartirla públicamente.

Los campos utilizados por el módulo son:

| Campo             | Tipo     | Descripción                                           |
| ----------------- | -------- | ----------------------------------------------------- |
| `id`              | `string` | Identificador de la lista.                            |
| `usuario_id`      | `string` | Usuario propietario de la lista.                      |
| `nombre`          | `string` | Nombre de la lista.                                   |
| `token_compartir` | `string` | Token utilizado para consultar la lista públicamente. |

## Items de la lista

Los productos de la lista se almacenan en `lista_deseos_items`.

| Campo                 | Tipo      | Descripción                                  |
| --------------------- | --------- | -------------------------------------------- |
| `id`                  | `string`  | Identificador del item.                      |
| `lista_id`            | `string`  | ID de la lista de deseos.                    |
| `producto_id`         | `string`  | ID del producto agregado.                    |
| `cantidad_deseada`    | `number`  | Cantidad que el usuario desea.               |
| `comprado`            | `boolean` | Indica si el producto ya fue comprado.       |
| `comprado_por_nombre` | `string`  | Nombre de la persona que compró el producto. |

Existe una restricción única sobre:

```text
(lista_id, producto_id)
```

Por lo tanto, un mismo producto no puede aparecer duplicado dentro de una misma lista.

Cuando se agrega nuevamente un producto que ya existe, se actualiza `cantidad_deseada`.

---

# `GET /api/lista-deseos/`

Obtiene la lista de deseos del usuario autenticado.

Si el usuario todavía no tiene una lista, se crea automáticamente.

## Autenticación

Requiere un usuario identificado mediante:

```ts
req.user;
```

o:

```ts
req.session.user;
```

El controlador utiliza:

```ts
private resolveUserId(req: Request): string | null {
  const user = (req as any).user || req.session?.user;
  return user?.id ? String(user.id) : null;
}
```

## Proceso

1. Obtiene el usuario desde `req.user` o `req.session.user`.
2. Extrae el `id` del usuario.
3. Si no existe un usuario autenticado, retorna `401`.
4. Busca la lista de deseos del usuario.
5. Si no existe, crea una nueva.
6. Retorna la lista.

## Query utilizada

```sql
WITH lista_existente AS (
  SELECT *
  FROM listas_deseos
  WHERE usuario_id = $1
),
nueva_lista AS (
  INSERT INTO listas_deseos (usuario_id)
  SELECT $1
  WHERE NOT EXISTS (
    SELECT 1
    FROM lista_existente
  )
  RETURNING *
)
SELECT *
FROM lista_existente

UNION ALL

SELECT *
FROM nueva_lista;
```

### Parámetros

| Posición | Parámetro    | Tipo     |
| -------: | ------------ | -------- |
|     `$1` | `usuario_id` | `string` |

## Ejemplo

```http
GET /api/lista-deseos/
```

## Respuesta — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "lista-id",
      "usuario_id": "usuario-id",
      "nombre": "Mi lista de deseos",
      "token_compartir": "abc123token"
    }
  ]
}
```

> La respuesta devuelve un arreglo porque la consulta utiliza `SELECT` sobre la lista existente o la nueva lista.

## Error — `401 Unauthorized`

```json
{
  "error": "Usuario no autenticado"
}
```

## Error — `500 Internal Server Error`

```json
{
  "error": "Error interno del servidor",
  "details": "..."
}
```

---

# `GET /api/lista-deseos/publica/:token`

Obtiene una lista de deseos utilizando su token público.

Esta ruta permite consultar una lista sin necesidad de conocer el `usuario_id`.

## Autenticación

No requiere autenticación.

El acceso se realiza mediante:

```text
token_compartir
```

## Parámetros

| Parámetro | Tipo     | Obligatorio | Descripción                |
| --------- | -------- | ----------: | -------------------------- |
| `token`   | `string` |          Sí | Token público de la lista. |

## Ejemplo

```http
GET /api/lista-deseos/publica/abc123token
```

## Proceso

1. Obtiene el `token` desde los parámetros de la URL.
2. Verifica que exista.
3. Busca una lista cuyo `token_compartir` coincida.
4. Obtiene los productos asociados.
5. Construye el arreglo `items`.
6. Retorna la lista pública.

## Query utilizada

```sql
SELECT
  l.id AS lista_id,
  l.nombre,
  l.token_compartir,
  l.usuario_id,
  COALESCE(
    json_agg(
      json_build_object(
        'item_id', i.id,
        'producto_id', p.id,
        'nombre', p.nombre,
        'descripcion', p.descripcion,
        'imagen_url', p.imagen_url,
        'cantidad_deseada', i.cantidad_deseada,
        'comprado', i.comprado,
        'comprado_por_nombre', i.comprado_por_nombre
      )
    ) FILTER (WHERE i.id IS NOT NULL),
    '[]'
  ) AS items
FROM listas_deseos l
LEFT JOIN lista_deseos_items i
  ON l.id = i.lista_id
LEFT JOIN productos p
  ON i.producto_id = p.id
WHERE l.token_compartir = $1
GROUP BY l.id;
```

### Parámetros

| Posición | Parámetro | Tipo     |
| -------: | --------- | -------- |
|     `$1` | `token`   | `string` |

## Respuesta — `200 OK`

```json
{
  "success": true,
  "data": {
    "lista_id": "lista-id",
    "nombre": "Mi lista de deseos",
    "token_compartir": "abc123token",
    "usuario_id": "usuario-id",
    "items": [
      {
        "item_id": "item-id",
        "producto_id": "producto-id",
        "nombre": "Camiseta deportiva",
        "descripcion": "Camiseta de alta calidad",
        "imagen_url": "http://localhost:5000/uploads/productos/camiseta.jpg",
        "cantidad_deseada": 2,
        "comprado": false,
        "comprado_por_nombre": null
      }
    ]
  }
}
```

Si la lista no contiene productos:

```json
{
  "success": true,
  "data": {
    "lista_id": "lista-id",
    "nombre": "Mi lista de deseos",
    "token_compartir": "abc123token",
    "usuario_id": "usuario-id",
    "items": []
  }
}
```

## Errores

### Token faltante — `400 Bad Request`

```json
{
  "error": "Token es requerido"
}
```

### Lista inexistente — `404 Not Found`

```json
{
  "error": "Lista de deseos no encontrada"
}
```

### Error interno — `500 Internal Server Error`

```json
{
  "error": "Error interno del servidor",
  "details": "..."
}
```

---

# `POST /api/lista-deseos/item`

Agrega un producto a una lista de deseos.

Si el producto ya existe dentro de la lista, la cantidad deseada se actualiza en lugar de crear un registro duplicado.

## Autenticación

La implementación del controlador no valida directamente un usuario autenticado.

La operación utiliza el `lista_id` enviado en el cuerpo de la petición.

> La protección de esta ruta, si existe, debe realizarse mediante un middleware o una validación adicional en otra capa.

## Content-Type

```http
Content-Type: application/json
```

## Campos

| Campo      | Tipo     | Obligatorio | Descripción                    |
| ---------- | -------- | ----------: | ------------------------------ |
| `lista_id` | `string` |          Sí | ID de la lista de deseos.      |
| `item`     | `object` |          Sí | Información del producto/item. |
| `cantidad` | `number` |          Sí | Cantidad deseada.              |

El controlador recibe:

```ts
const { lista_id, item, cantidad } = req.body;
```

Luego ejecuta:

```ts
await this.listaDeseoRepository.agregarItem(lista_id, item, cantidad);
```

> En la query de repositorio, el segundo parámetro corresponde al `producto_id`. Por lo tanto, el valor enviado como `item` debe representar el identificador del producto esperado por el repositorio.

## Ejemplo

```http
POST /api/lista-deseos/item
Content-Type: application/json
```

```json
{
  "lista_id": "lista-id",
  "item": "producto-id",
  "cantidad": 2
}
```

## Query utilizada

```sql
INSERT INTO lista_deseos_items (
  lista_id,
  producto_id,
  cantidad_deseada
)
VALUES ($1, $2, $3)

ON CONFLICT (lista_id, producto_id)
DO UPDATE SET
  cantidad_deseada = EXCLUDED.cantidad_deseada

RETURNING *;
```

### Parámetros

| Posición | Parámetro          | Tipo     |
| -------: | ------------------ | -------- |
|     `$1` | `lista_id`         | `string` |
|     `$2` | `producto_id`      | `string` |
|     `$3` | `cantidad_deseada` | `number` |

## Comportamiento

### Producto nuevo

Si el producto no existe en la lista:

```text
Crear nuevo item
```

### Producto existente

Si ya existe:

```text
Actualizar cantidad_deseada
```

Esto evita duplicados para el mismo producto dentro de una lista.

## Respuesta — `200 OK`

```json
{
  "success": true,
  "data": "producto-id"
}
```

El controlador devuelve en `data` el valor recibido en `item`.

## Errores

### Lista faltante — `400 Bad Request`

```json
{
  "error": "Lista de deseos es requerida"
}
```

### Item o cantidad faltantes — `400 Bad Request`

```json
{
  "error": "Item y cantidad son requeridos"
}
```

### Error interno — `500 Internal Server Error`

```json
{
  "error": "Error interno del servidor",
  "details": "..."
}
```

---

# `DELETE /api/lista-deseos/item`

Elimina un producto de una lista de deseos.

## Autenticación

La implementación del controlador no valida directamente un usuario autenticado.

La operación se realiza utilizando `lista_id` y `producto_id`.

## Content-Type

```http
Content-Type: application/json
```

## Campos

| Campo         | Tipo     | Obligatorio | Descripción                            |
| ------------- | -------- | ----------: | -------------------------------------- |
| `lista_id`    | `string` |          Sí | ID de la lista de deseos.              |
| `producto_id` | `string` |          Sí | ID del producto que se desea eliminar. |

## Ejemplo

```http
DELETE /api/lista-deseos/item
Content-Type: application/json
```

```json
{
  "lista_id": "lista-id",
  "producto_id": "producto-id"
}
```

## Proceso

1. Obtiene `lista_id` y `producto_id`.
2. Verifica que ambos estén presentes.
3. Busca el item correspondiente a la lista y al producto.
4. Elimina el item.
5. Retorna los identificadores utilizados.

## Query utilizada

```sql
DELETE FROM lista_deseos_items
WHERE lista_id = $1
  AND producto_id = $2;
```

### Parámetros

| Posición | Parámetro     | Tipo     |
| -------: | ------------- | -------- |
|     `$1` | `lista_id`    | `string` |
|     `$2` | `producto_id` | `string` |

## Respuesta — `200 OK`

```json
{
  "success": true,
  "data": {
    "lista_id": "lista-id",
    "producto_id": "producto-id"
  }
}
```

## Errores

### Parámetros faltantes — `400 Bad Request`

```json
{
  "error": "Lista de deseos y producto son requeridos"
}
```

### Error interno — `500 Internal Server Error`

```json
{
  "error": "Error interno del servidor",
  "details": "..."
}
```

---

# `PUT /api/lista-deseos/item/comprado`

Marca un producto de la lista como comprado.

También registra el nombre de la persona que realizó la compra.

## Autenticación

La implementación del controlador no valida directamente un usuario autenticado.

La operación utiliza el `item_id` enviado en la petición.

## Content-Type

```http
Content-Type: application/json
```

## Campos

| Campo                 | Tipo     | Obligatorio | Descripción                                 |
| --------------------- | -------- | ----------: | ------------------------------------------- |
| `item_id`             | `string` |          Sí | ID del item de la lista.                    |
| `comprado_por_nombre` | `string` |          Sí | Nombre de la persona que realizó la compra. |

## Ejemplo

```http
PUT /api/lista-deseos/item/comprado
Content-Type: application/json
```

```json
{
  "item_id": "item-id",
  "comprado_por_nombre": "Juan Pérez"
}
```

## Proceso

1. Obtiene `item_id`.
2. Obtiene `comprado_por_nombre`.
3. Verifica que ambos estén presentes.
4. Actualiza el item.
5. Establece `comprado = true`.
6. Guarda el nombre del comprador.
7. Retorna los datos utilizados.

## Query utilizada

```sql
UPDATE lista_deseos_items
SET
  comprado = true,
  comprado_por_nombre = $1
WHERE id = $2
RETURNING *;
```

### Parámetros

| Posición | Parámetro             | Tipo     |
| -------: | --------------------- | -------- |
|     `$1` | `comprado_por_nombre` | `string` |
|     `$2` | `item_id`             | `string` |

## Respuesta — `200 OK`

```json
{
  "success": true,
  "data": {
    "item_id": "item-id",
    "comprado_por_nombre": "Juan Pérez"
  }
}
```

## Errores

### Parámetros faltantes — `400 Bad Request`

```json
{
  "error": "Item ID y nombre del comprador son requeridos"
}
```

### Error interno — `500 Internal Server Error`

```json
{
  "error": "Error interno del servidor",
  "details": "..."
}
```

---

# Relaciones entre las tablas

La estructura principal del módulo puede representarse de la siguiente manera:

```text
usuarios
   │
   │ usuario_id
   ▼
listas_deseos
   │
   │ lista_id
   ▼
lista_deseos_items
   │
   │ producto_id
   ▼
productos
```

Cada lista de deseos pertenece a un usuario:

```text
usuarios
   1
   │
   │
   N
listas_deseos
```

Cada lista puede contener múltiples productos:

```text
listas_deseos
   1
   │
   │
   N
lista_deseos_items
```

Cada item referencia un producto:

```text
productos
   1
   │
   │
   N
lista_deseos_items
```

---

# Token público

Cada lista dispone de un campo:

```text
token_compartir
```

Este token permite generar una URL pública para consultar la lista:

```text
/api/lista-deseos/publica/:token
```

Por ejemplo:

```text
/api/lista-deseos/publica/abc123token
```

La consulta pública devuelve:

- ID de la lista.
- Nombre de la lista.
- Token.
- Usuario propietario.
- Productos incluidos.
- Cantidad deseada.
- Estado de compra.
- Nombre del comprador.
- Información básica del producto.
- Imagen del producto.

---

# Comportamiento de los items

## Agregar producto

Al ejecutar:

```text
POST /api/lista-deseos/item
```

se utiliza:

```sql
ON CONFLICT (lista_id, producto_id)
DO UPDATE SET cantidad_deseada = EXCLUDED.cantidad_deseada;
```

Por lo tanto:

```text
Producto no existe
        ↓
Crear item

Producto ya existe
        ↓
Actualizar cantidad_deseada
```

No se crean dos items para el mismo producto dentro de la misma lista.

## Eliminar producto

La eliminación utiliza:

```text
lista_id + producto_id
```

por lo que el producto se elimina únicamente de la lista indicada.

## Marcar como comprado

Cuando un item se marca como comprado:

```text
comprado = true
```

y se almacena:

```text
comprado_por_nombre
```

El registro no se elimina de la lista.

Esto permite que una lista compartida pueda mostrar qué productos ya fueron comprados.

---

# Rutas completas

```ts
router.get("/", (req: Request, res: Response) => {
  ListaDeseoController.obtenerOCrearLista(req, res);
});

router.get("/publica/:token", (req: Request, res: Response) => {
  ListaDeseoController.obtenerPorToken(req, res);
});

router.post("/item", (req: Request, res: Response) => {
  ListaDeseoController.agregarItem(req, res);
});

router.delete("/item", (req: Request, res: Response) => {
  ListaDeseoController.eliminarItem(req, res);
});

router.put("/item/comprado", (req: Request, res: Response) => {
  ListaDeseoController.marcarComprado(req, res);
});
```

La ruta base del módulo es:

```text
/api/lista-deseos/
```

Por lo tanto, las rutas finales son:

```text
GET    /api/lista-deseos/
GET    /api/lista-deseos/publica/:token
POST   /api/lista-deseos/item
DELETE /api/lista-deseos/item
PUT    /api/lista-deseos/item/comprado
```

---

# Flujo general

```text
Usuario autenticado
        ↓
GET /api/lista-deseos/
        ↓
Buscar lista existente
        ↓
¿Existe?
   ┌────┴────┐
   │         │
  Sí        No
   │         │
   │      Crear lista
   │         │
   └────┬────┘
        ↓
   Lista de deseos
        │
        ├── POST /item
        │       ↓
        │   Agregar producto
        │       ↓
        │   Actualizar cantidad si existe
        │
        ├── DELETE /item
        │       ↓
        │   Eliminar producto
        │
        └── PUT /item/comprado
                ↓
          Marcar como comprado
                ↓
       Registrar comprador


Compartir lista
        ↓
token_compartir
        ↓
GET /publica/:token
        ↓
Consultar lista públicamente
```

---

# Resumen de operaciones

| Operación           | Endpoint              | Acción                                               |
| ------------------- | --------------------- | ---------------------------------------------------- |
| Obtener/crear lista | `GET /`               | Obtiene la lista del usuario o crea una nueva.       |
| Ver lista pública   | `GET /publica/:token` | Consulta una lista mediante token.                   |
| Agregar producto    | `POST /item`          | Agrega un producto o actualiza su cantidad.          |
| Eliminar producto   | `DELETE /item`        | Elimina un producto de la lista.                     |
| Marcar comprado     | `PUT /item/comprado`  | Marca un item como comprado y registra al comprador. |

---

# Repositorio y consultas

Las operaciones utilizadas por el repositorio son:

```text
obtenerOCrearListaUsuario
obtenerListaPorToken
agregarItemLista
eliminarItemLista
marcarItemComprado
```

Todas las consultas utilizan parámetros (`$1`, `$2`, `$3`) para enviar los valores correspondientes a PostgreSQL.

# 📦 Documentación — Productos

Este módulo administra los productos del catálogo, incluyendo información general, cuatro niveles de precios, categorías, imagen de portada, video y galería.

## Resumen de endpoints

| Método   | Endpoint             | Auth | Descripción                   |
| -------- | -------------------- | ---: | ----------------------------- |
| `GET`    | `/api/productos/`    |   No | Listar todos los productos.   |
| `GET`    | `/api/productos/:id` |   No | Consultar un producto por ID. |
| `POST`   | `/api/productos/`    |   Sí | Crear un producto.            |
| `PUT`    | `/api/productos/:id` |   Sí | Actualizar un producto.       |
| `DELETE` | `/api/productos/:id` |   Sí | Eliminar un producto.         |

---

# Modelo de producto

Los datos principales se almacenan en la tabla `productos`.

| Campo                  | Tipo      | Descripción                  |
| ---------------------- | --------- | ---------------------------- |
| `id`                   | `string`  | Identificador del producto.  |
| `nombre`               | `string`  | Nombre del producto.         |
| `descripcion`          | `string`  | Descripción del producto.    |
| `descuento_porcentaje` | `number`  | Porcentaje de descuento.     |
| `imagen_url`           | `string`  | URL de la imagen de portada. |
| `video_url`            | `string` \| `null` | URL del video del producto. |
| `stock`                | `number`  | Existencias disponibles.     |
| `estado`               | `boolean` | Estado del producto.         |

> **Importante:** `precio` no es un campo de `productos`. Los precios se almacenan en `precios_productos` y se relacionan mediante `id_producto`.

## Precios

Cada producto puede tener cuatro niveles de precio:

| `tipo_precio` | Descripción |
| ------------- | ----------- |
| `detal_usd`   | Precio al detal promocional o estándar en USD. |
| `detal_bs`    | Precio al detal oficial en bolívares. |
| `Mayor`       | Precio de venta al mayor, normalmente desde 6 unidades. |
| `GranMayor`   | Precio de venta al gran mayor, normalmente desde 40 unidades. |

La estructura de cada precio es:

```json
{
  "tipo_precio": "detal_usd",
  "precio": 25.0
}
```

Ejemplo de los cuatro precios:

```json
[
  {
    "tipo_precio": "detal_usd",
    "precio": 25.0
  },
  {
    "tipo_precio": "detal_bs",
    "precio": 26.87
  },
  {
    "tipo_precio": "Mayor",
    "precio": 20.0
  },
  {
    "tipo_precio": "GranMayor",
    "precio": 18.0
  }
]
```

---

# `GET /api/productos`

Obtiene la lista completa de productos.

## Autenticación

No requiere autenticación.

## Ejemplo

```http
GET /api/productos/
```

## Respuesta — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "producto-id",
      "nombre": "Camiseta deportiva",
      "descripcion": "Camiseta de alta calidad",
      "descuento_porcentaje": 10,
      "imagen_url": "http://localhost:9090/mi-tienda-local/productos/imagenes/camiseta.jpg",
      "video_url": null,
      "stock": 25,
      "estado": true,
      "creado_en": "2026-11-09T23:05:23.040Z",
      "precios": [
        {
          "id_precio": "precio-id-1",
          "tipo_precio": "detal_usd",
          "precio": 25,
          "precio_final": 25
        },
        {
          "id_precio": "precio-id-2",
          "tipo_precio": "detal_bs",
          "precio": 26.87,
          "precio_final": 26.87
        },
        {
          "id_precio": "precio-id-3",
          "tipo_precio": "Mayor",
          "precio": 20,
          "precio_final": 20
        },
        {
          "id_precio": "precio-id-4",
          "tipo_precio": "GranMayor",
          "precio": 18,
          "precio_final": 18
        }
      ]
    }
  ]
}
```

## Error — `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Error al obtener la lista de productos"
}
```

---

# `GET /api/productos/:id`

Obtiene un producto específico mediante su identificador.

## Autenticación

No requiere autenticación.

## Parámetros

| Parámetro | Tipo     | Obligatorio | Descripción      |
| --------- | -------- | ----------: | ---------------- |
| `id`      | `string` |          Sí | ID del producto. |

## Ejemplo

```http
GET /api/productos/producto-id
```

## Respuesta — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "producto-id",
    "nombre": "Camiseta deportiva",
    "descripcion": "Camiseta de alta calidad",
    "descuento_porcentaje": 10,
    "imagen_url": "http://localhost:9090/mi-tienda-local/productos/imagenes/camiseta.jpg",
    "video_url": null,
    "stock": 25,
    "estado": true,
    "creado_en": "2026-11-09T23:05:23.040Z",
    "precios": [
      {
        "id_precio": "precio-id-1",
        "tipo_precio": "detal_usd",
        "precio": 25,
        "precio_final": 25
      },
      {
        "id_precio": "precio-id-2",
        "tipo_precio": "detal_bs",
        "precio": 26.87,
        "precio_final": 26.87
      },
      {
        "id_precio": "precio-id-3",
        "tipo_precio": "Mayor",
        "precio": 20,
        "precio_final": 20
      },
      {
        "id_precio": "precio-id-4",
        "tipo_precio": "GranMayor",
        "precio": 18,
        "precio_final": 18
      }
    ]
  }
}
```

## Errores

### `400 Bad Request`

```json
{
  "success": false,
  "message": "El parámetro ID es requerido"
}
```

### `404 Not Found`

```json
{
  "success": false,
  "message": "Producto no encontrado"
}
```

### `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Error al obtener el producto"
}
```

---

# `POST /api/productos`

Crea un nuevo producto utilizando los datos del producto y las referencias de almacenamiento generadas mediante Presigned URLs.

Requiere autenticación.

> **Importante:** la imagen ya no se envía directamente a este endpoint mediante `multipart/form-data`. Primero se solicita una Presigned URL al backend, luego el frontend sube la imagen directamente a S3/S3Mock y finalmente se crea el producto enviando `imagen_url` con la URL del objeto.

## Flujo recomendado

```text
1. POST /api/productos/upload-url
        ↓
   Backend genera uploadUrl + publicUrl + objectKey
        ↓
2. PUT uploadUrl
   Frontend sube la imagen directamente a S3/S3Mock
        ↓
3. POST /api/productos/
   Se crea el producto usando imagen_url = publicUrl
        ↓
   Producto guardado en PostgreSQL
```

---

## Paso 1 — Obtener Presigned URL para la imagen

Solicita al backend una URL temporal firmada para subir la imagen.

### Endpoint

```http
POST /api/productos/upload-url
```

### Headers

```http
Content-Type: application/json
```

### Body

```json
{
  "nombreArchivo": "camiseta.jpg",
  "tipoMime": "image/jpeg",
  "destino": "imagen"
}
```

### Respuesta esperada

```json
{
  "success": true,
  "data": {
    "uploadUrl": "http://localhost:9090/mi-tienda-local/productos/imagenes/1727632800-abc12.jpg?X-Amz-Algorithm=...",
    "publicUrl": "http://localhost:9090/mi-tienda-local/productos/imagenes/1727632800-abc12.jpg",
    "objectKey": "productos/imagenes/1727632800-abc12.jpg"
  }
}
```

### Datos importantes

- `uploadUrl`: URL temporal que se utiliza **solo para subir** el archivo.
- `publicUrl`: URL que se utilizará como `imagen_url` al crear el producto.
- `objectKey`: identificador del archivo dentro del bucket.

> **No se debe guardar `uploadUrl` en la base de datos**, porque es una URL temporal y expira.

---

## Paso 2 — Subir la imagen directamente a S3 / S3Mock

El frontend utiliza la `uploadUrl` recibida en el paso anterior.

Esta petición **no pasa por el backend Express**. Va directamente al almacenamiento S3/S3Mock.

### Request

```http
PUT <uploadUrl>
```

### Headers

```http
Content-Type: image/jpeg
```

> El `Content-Type` debe ser idéntico al `tipoMime` utilizado al solicitar la Presigned URL.

### Body

El archivo binario de la imagen.

### Ejemplo con JavaScript

```ts
await fetch(uploadUrl, {
  method: "PUT",
  headers: {
    "Content-Type": file.type,
  },
  body: file,
});
```

### Respuesta esperada

```text
200 OK
```

Una vez completado el `PUT`, la imagen queda almacenada en S3/S3Mock.

Ejemplo:

```text
mi-tienda-local/
└── productos/
    └── imagenes/
        └── 1727632800-abc12.jpg
```

---

## Paso 3 — Crear el producto

Una vez que la imagen se subió correctamente, se crea el producto mediante:

```http
POST /api/productos/
```

Requiere autenticación.

### Content-Type

```http
Content-Type: application/json
```

### Body

```json
{
  "nombre": "Camiseta Deportiva",
  "descripcion": "Camiseta de alta calidad",
  "imagen_url": "http://localhost:9090/mi-tienda-local/productos/imagenes/1727632800-abc12.jpg",
  "video_url": null,
  "galeria": [],
  "precios": [
    {
      "tipo_precio": "detal_usd",
      "precio": 25.0
    },
    {
      "tipo_precio": "detal_bs",
      "precio": 26.87
    },
    {
      "tipo_precio": "Mayor",
      "precio": 20.0
    },
    {
      "tipo_precio": "GranMayor",
      "precio": 18.0
    }
  ],
  "stock": 50,
  "categorias_ids": ["categoria-id"]
}
```

### Campos principales

| Campo         | Tipo     | Obligatorio | Descripción                                      |
| ------------- | -------- | ----------: | ------------------------------------------------ |
| `nombre`      | `string` |          Sí | Nombre del producto.                             |
| `descripcion` | `string` |          Sí | Descripción del producto.                        |
| `imagen_url`  | `string` |          Sí | URL de la imagen previamente subida a S3/S3Mock. |
| `video_url`   | `string` \| `null` | No | URL del video del producto.                 |
| `galeria`     | `array`  |          No | Imágenes adicionales del producto.               |
| `precios`     | `array`  |          Sí | Lista de precios por nivel.                      |
| `stock`       | `number` |          Sí | Existencias disponibles.                         |
| `categorias_ids` | `array` |       No | Identificadores de las categorías asociadas.    |

> **Importante:** `imagen_url` debe contener la `publicUrl` obtenida en el Paso 1, no la `uploadUrl`.

### Ejemplo completo

```json
{
  "nombre": "Camiseta Deportiva",
  "descripcion": "Camiseta de alta calidad",
  "imagen_url": "http://localhost:9090/mi-tienda-local/productos/imagenes/1727632800-abc12.jpg",
  "video_url": null,
  "galeria": [],
  "precios": [
    {
      "tipo_precio": "detal_usd",
      "precio": 25.0
    },
    {
      "tipo_precio": "detal_bs",
      "precio": 26.87
    },
    {
      "tipo_precio": "Mayor",
      "precio": 20.0
    },
    {
      "tipo_precio": "GranMayor",
      "precio": 18.0
    }
  ],
  "stock": 50,
  "categorias_ids": ["categoria-id"]
}
```

### Respuesta esperada — `201 Created`

```json
{
  "success": true,
  "message": "Producto creado exitosamente",
  "data": {
    "id": "producto-id",
    "nombre": "Camiseta Deportiva",
    "descripcion": "Camiseta de alta calidad",
    "imagen_url": "http://localhost:9090/mi-tienda-local/productos/imagenes/1727632800-abc12.jpg",
    "video_url": null,
    "stock": 50,
    "estado": true,
    "creado_en": "2026-11-09T23:05:23.040Z",
    "precios": [
      {
        "id_precio": "precio-id-1",
        "tipo_precio": "detal_usd",
        "precio": 25,
        "precio_final": 25
      },
      {
        "id_precio": "precio-id-2",
        "tipo_precio": "detal_bs",
        "precio": 26.87,
        "precio_final": 26.87
      },
      {
        "id_precio": "precio-id-3",
        "tipo_precio": "Mayor",
        "precio": 20,
        "precio_final": 20
      },
      {
        "id_precio": "precio-id-4",
        "tipo_precio": "GranMayor",
        "precio": 18,
        "precio_final": 18
      }
    ]
  }
}
```

---

## Resumen del flujo de creación

```text
Frontend
   │
   │ 1. POST /api/productos/upload-url
   │    { nombreArchivo, tipoMime, destino }
   ▼
Backend
   │
   │ genera uploadUrl + publicUrl + objectKey
   ▼
Frontend
   │
   │ 2. PUT uploadUrl
   │    Body: archivo binario
   ▼
S3 / S3Mock
   │
   │ imagen almacenada
   ▼
Frontend
   │
   │ 3. POST /api/productos/
   │    { nombre, descripcion, imagen_url, video_url, ... }
   ▼
Backend
   │
   │ guarda producto
   ▼
PostgreSQL
```

> **La URL que se guarda en `productos.imagen_url` es `publicUrl`. La `uploadUrl` solamente se utiliza durante la subida y no debe persistirse.**

---

# `PUT /api/productos/:id`

Actualiza parcialmente un producto existente.

Requiere autenticación.

> **Importante:** para cambiar la imagen de portada se debe repetir el flujo de Presigned URL: solicitar una nueva URL, subir la nueva imagen directamente a S3/S3Mock y después enviar la nueva `imagen_url` en este endpoint.

## Parámetro

| Parámetro | Tipo     | Obligatorio | Descripción      |
| --------- | -------- | ----------: | ---------------- |
| `id`      | `string` |          Sí | ID del producto. |

## Campos actualizables

| Campo                  | Tipo      | Descripción                        |
| ---------------------- | --------- | ---------------------------------- |
| `nombre`               | `string`  | Nuevo nombre.                      |
| `descripcion`          | `string`  | Nueva descripción.                 |
| `descuento_porcentaje` | `number`  | Nuevo descuento.                   |
| `imagen_url`           | `string`  | Nueva URL de la imagen de portada. |
| `video_url`            | `string`  | Nueva URL del video del producto.  |
| `stock`                | `number`  | Nuevo stock.                       |
| `estado`               | `boolean` | Estado del producto.               |

Los campos omitidos conservan su valor actual.

## Content-Type

```http
Content-Type: application/json
```

## Ejemplo

```http
PUT /api/productos/producto-id
```

```json
{
  "nombre": "Camiseta deportiva premium",
  "descripcion": "Camiseta deportiva de alta calidad",
  "descuento_porcentaje": 15,
  "imagen_url": "http://localhost:9090/mi-tienda-local/productos/imagenes/nueva-camiseta.jpg",
  "video_url": "https://ejemplo.com/videos/camiseta-premium.mp4",
  "stock": 30,
  "estado": true
}
```

> Si se actualiza `imagen_url`, la nueva imagen debe haber sido subida previamente mediante una Presigned URL.

## Respuesta — `200 OK`

```json
{
  "success": true,
  "message": "Producto actualizado exitosamente",
  "data": {
    "id": "producto-id",
    "nombre": "Camiseta deportiva premium",
    "descuento_porcentaje": 15,
    "stock": 30,
    "estado": true,
    "imagen_url": "http://localhost:9090/mi-tienda-local/productos/imagenes/nueva-camiseta.jpg",
    "video_url": "https://ejemplo.com/videos/camiseta-premium.mp4"
  }
}
```

## Errores

### Validación — `400`

```json
{
  "success": false,
  "message": "Error de validación",
  "errors": {
    "stock": ["El stock no es válido"]
  }
}
```

### Producto inexistente — `404`

```json
{
  "success": false,
  "message": "El producto a actualizar no existe"
}
```

---

# `DELETE /api/productos/:id`

Elimina un producto.

Requiere autenticación.

## Ejemplo

```http
DELETE /api/productos/producto-id
```

## Proceso

1. Obtiene el ID.
2. Verifica que exista.
3. Elimina el producto mediante `eliminarProducto()`.
4. Retorna una confirmación.

## Respuesta — `200 OK`

```json
{
  "success": true,
  "message": "Producto eliminado exitosamente"
}
```

## Errores

### ID faltante — `400`

```json
{
  "success": false,
  "message": "El parámetro ID es requerido"
}
```

### Producto inexistente — `404`

```json
{
  "success": false,
  "message": "Producto no encontrado"
}
```

### Error interno — `500`

```json
{
  "success": false,
  "message": "Error al eliminar el producto"
}
```

---

# Operaciones relacionadas

Las categorías se reciben mediante `categorias_ids`. Al actualizar un producto,
las asociaciones se sincronizan con los identificadores enviados; al eliminarlo,
se eliminan sus asociaciones, pero no las categorías.

La galería se devuelve como información relacionada del producto. Sus imágenes se
almacenan en `producto_imagenes`, mientras que la imagen principal se referencia
desde `productos.imagen_url`.

---

# Almacenamiento de imágenes y videos

Las imágenes de portada se almacenan en S3/S3Mock.

Ejemplo de estructura:

```text
mi-tienda-local/
└── productos/
    └── imagenes/
        ├── 1727632800-abc12.jpg
        └── nueva-camiseta.jpg
```

La referencia de la imagen de portada se almacena en:

```text
productos.imagen_url
```

El video del producto se referencia mediante:

```text
productos.video_url
```

> La documentación actual contempla `video_url` como una URL recibida por el endpoint de productos. El flujo específico para subir videos mediante Presigned URL no está definido en este documento.

Las imágenes adicionales de galería se almacenan en:

```text
producto_imagenes
```

# Middlewares utilizados

## `authMiddleware`

Protege las operaciones que modifican productos:

```ts
router.post("/", authMiddleware, ...);
router.put("/:id", authMiddleware, ...);
router.delete("/:id", authMiddleware, ...);
```

Las imágenes no se procesan mediante `multipart/form-data` en los endpoints de
productos. Se cargan directamente a S3/S3Mock mediante Presigned URLs y luego se
envía la `publicUrl` en `imagen_url`.

---

# Rutas completas

```ts
router.post("/", authMiddleware, (req, res) =>
  ProductController.createProducto(req, res),
);

router.put("/:id", authMiddleware, (req, res) =>
  ProductController.updateProducto(req, res),
);

router.delete("/:id", authMiddleware, (req, res) =>
  ProductController.deleteProducto(req, res),
);

router.get("/:id", (req, res) => ProductController.getProductoPorId(req, res));

router.get("/products", (req, res) => ProductController.getProductos(req, res));
```

> Los campos obligatorios y las restricciones específicas dependen de los esquemas utilizados por `validateCrearProducto()` y `validateActualizarProducto()`.

---

# Flujo de creación

```text
Solicitar Presigned URL
        ↓
POST /api/productos/upload-url
        ↓
Recibir uploadUrl + publicUrl + objectKey
        ↓
Subir imagen directamente a S3/S3Mock
        ↓
PUT uploadUrl
        ↓
Crear producto
        ↓
POST /api/productos/
        ↓
Guardar imagen_url = publicUrl
        ↓
Guardar video_url si existe
        ↓
Guardar precios
        ↓
Asociar categorías
        ↓
Guardar galería
        ↓
Retornar producto creado
```

## Regla para las URLs

```text
uploadUrl
   ↓
Se usa únicamente para subir el archivo.
Es temporal.
NO se guarda en PostgreSQL.

publicUrl
   ↓
Referencia al archivo almacenado.
Se envía como imagen_url.
Es la URL que se persiste en el producto.
```

## Flujo completo desde el frontend

```text
1. Seleccionar imagen
        ↓
2. POST /api/productos/upload-url
        ↓
3. Recibir uploadUrl + publicUrl
        ↓
4. PUT uploadUrl con el archivo
        ↓
5. Verificar que la subida terminó correctamente
        ↓
6. POST /api/productos/
        ↓
7. Enviar imagen_url = publicUrl
        ↓
8. Enviar video_url si el producto tiene video
        ↓
9. Producto creado
```

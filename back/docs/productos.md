# 📦 Documentación — Productos

Este módulo administra los productos del catálogo, incluyendo información general, precios por nivel, categorías e imágenes de galería.

## Resumen de endpoints

| Método   | Endpoint                     | Auth | Descripción                   |
| -------- | ---------------------------- | ---: | ----------------------------- |
| `GET`    | `/api/productos/products`    |   No | Listar todos los productos.   |
| `GET`    | `/api/productos/product/:id` |   No | Consultar un producto por ID. |
| `POST`   | `/api/productos/product`     |   Sí | Crear un producto.            |
| `PUT`    | `/api/productos/product/:id` |   Sí | Actualizar un producto.       |
| `DELETE` | `/api/productos/product/:id` |   Sí | Eliminar un producto.         |

---

# Modelo de producto

Los datos principales se almacenan en la tabla `productos`.

| Campo                  | Tipo      | Descripción                          |
| ---------------------- | --------- | ------------------------------------ |
| `id`                   | `string`  | Identificador del producto.          |
| `nombre`               | `string`  | Nombre del producto.                 |
| `descripcion`          | `string`  | Descripción del producto.            |
| `descuento_porcentaje` | `number`  | Porcentaje de descuento.             |
| `imagen_url`           | `string`  | URL pública de la imagen de portada. |
| `stock`                | `number`  | Existencias disponibles.             |
| `estado`               | `boolean` | Estado del producto.                 |

> **Importante:** `precio` no es un campo de `productos`. Los precios se almacenan en `precios_productos` y se relacionan mediante `id_producto`.

## Precios

Cada producto puede tener hasta tres niveles de precio:

| `tipo_precio` | Descripción                    |
| ------------- | ------------------------------ |
| `Detal`       | Precio de venta detallada.     |
| `Mayor`       | Precio de venta al mayor.      |
| `GranMayor`   | Precio de venta al gran mayor. |

La estructura de cada precio es:

```json
{
  "tipo_precio": "Detal",
  "precio": 25.0
}
```

Ejemplo de los tres precios:

```json
[
  {
    "tipo_precio": "Detal",
    "precio": 25.0
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

# `GET /api/productos/products`

Obtiene la lista completa de productos.

## Autenticación

No requiere autenticación.

## Ejemplo

```http
GET /api/productos/products
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
      "imagen_url": "http://localhost:5000/uploads/productos/camiseta.jpg",
      "stock": 25,
      "estado": true,
      "precios": [
        {
          "id_precio": "precio-id-1",
          "tipo_precio": "Detal",
          "precio": 25
        },
        {
          "id_precio": "precio-id-2",
          "tipo_precio": "Mayor",
          "precio": 20
        },
        {
          "id_precio": "precio-id-3",
          "tipo_precio": "GranMayor",
          "precio": 18
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

# `GET /api/productos/product/:id`

Obtiene un producto específico mediante su identificador.

## Autenticación

No requiere autenticación.

## Parámetros

| Parámetro | Tipo     | Obligatorio | Descripción      |
| --------- | -------- | ----------: | ---------------- |
| `id`      | `string` |          Sí | ID del producto. |

## Ejemplo

```http
GET /api/productos/product/producto-id
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
    "imagen_url": "http://localhost:5000/uploads/productos/camiseta.jpg",
    "stock": 25,
    "estado": true,
    "precios": [
      {
        "id_precio": "precio-id-1",
        "tipo_precio": "Detal",
        "precio": 25
      },
      {
        "id_precio": "precio-id-2",
        "tipo_precio": "Mayor",
        "precio": 20
      },
      {
        "id_precio": "precio-id-3",
        "tipo_precio": "GranMayor",
        "precio": 18
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

# `POST /api/productos/product`

Crea un nuevo producto utilizando `multipart/form-data`.

Requiere autenticación.

## Content-Type

```http
Content-Type: multipart/form-data
```

## Archivos

| Campo     | Tipo     | Obligatorio | Descripción                        |
| --------- | -------- | ----------: | ---------------------------------- |
| `imagen`  | `File`   |          Sí | Imagen principal o portada.        |
| `galeria` | `File[]` |          No | Imágenes adicionales del producto. |

## Campos del formulario

| Campo                  | Tipo recibido | Tipo procesado | Descripción                      |
| ---------------------- | ------------- | -------------- | -------------------------------- |
| `nombre`               | `string`      | `string`       | Nombre del producto.             |
| `descripcion`          | `string`      | `string`       | Descripción del producto.        |
| `precios`              | `JSON string` | `array`        | Lista de precios del producto.   |
| `descuento_porcentaje` | `string`      | `number`       | Porcentaje de descuento.         |
| `stock`                | `string`      | `number`       | Existencias disponibles.         |
| `categorias_ids`       | `JSON string` | `array`        | IDs de las categorías asociadas. |

Las restricciones definitivas son determinadas por `validateCrearProducto()`.

## Formato de `precios`

`precios` debe enviarse como una cadena JSON válida.

Debe contener los niveles de precio correspondientes al producto:

```json
[
  {
    "tipo_precio": "Detal",
    "precio": 25.0
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

> **No se debe enviar un campo `precio` individual.** Los precios se envían dentro del arreglo `precios`.

## Formato de `categorias_ids`

También debe enviarse como JSON:

```json
[1, 3]
```

## Ejemplo de `form-data`

```text
nombre: Camiseta deportiva
descripcion: Camiseta deportiva de alta calidad
precios: [{"tipo_precio":"Detal","precio":25},{"tipo_precio":"Mayor","precio":20},{"tipo_precio":"GranMayor","precio":18}]
descuento_porcentaje: 10
stock: 25
categorias_ids: [1, 3]
imagen: camiseta.jpg
galeria: camiseta-frente.jpg
galeria: camiseta-atras.jpg
```

## Conversión de datos

Los campos recibidos desde `multipart/form-data` se convierten antes de la validación:

```ts
precios: request.body.precios
  ? JSON.parse(request.body.precios)
  : [],

descuento_porcentaje: request.body.descuento_porcentaje
  ? Number(request.body.descuento_porcentaje)
  : undefined,

stock: request.body.stock
  ? Number(request.body.stock)
  : undefined,

categorias_ids: request.body.categorias_ids
  ? JSON.parse(request.body.categorias_ids)
  : undefined,
```

## Proceso

1. Recibe `multipart/form-data`.
2. Obtiene la imagen principal.
3. Obtiene las imágenes de galería.
4. Verifica que exista la portada.
5. Convierte `precios` desde JSON.
6. Convierte `categorias_ids` desde JSON.
7. Convierte `descuento_porcentaje` y `stock` a números.
8. Valida los datos.
9. Construye la URL pública de la portada.
10. Crea el registro del producto.
11. Inserta los precios del producto.
12. Asocia las categorías.
13. Guarda las imágenes secundarias.
14. Retorna el producto creado.

## Consultas relacionadas

### Crear producto

```sql
INSERT INTO productos
  (nombre, descripcion, descuento_porcentaje, imagen_url, stock)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, nombre, descuento_porcentaje, stock, estado;
```

### Agregar precio

```sql
INSERT INTO precios_productos (id_producto, tipo_precio, precio)
VALUES ($1, $2, $3)
RETURNING id_precio, tipo_precio, precio;
```

Parámetros:

| Posición | Parámetro     | Tipo     |
| -------: | ------------- | -------- |
|     `$1` | `id_producto` | `string` |
|     `$2` | `tipo_precio` | `string` |
|     `$3` | `precio`      | `number` |

El proceso de creación puede insertar los tres niveles:

```text
Detal
Mayor
GranMayor
```

### Asociar categoría

```sql
INSERT INTO producto_categorias (producto_id, categoria_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;
```

### Agregar imagen de galería

```sql
INSERT INTO producto_imagenes (producto_id, url, es_principal)
VALUES ($1, $2, $3)
RETURNING id, url, es_principal;
```

Las imágenes secundarias se guardan con:

```text
es_principal = false
```

## Respuesta — `201 Created`

```json
{
  "success": true,
  "message": "Producto creado exitosamente con su galería",
  "data": {
    "id": "producto-id",
    "nombre": "Camiseta deportiva",
    "descuento_porcentaje": 10,
    "stock": 25,
    "estado": true
  }
}
```

## Errores

### Imagen de portada faltante — `400`

```json
{
  "success": false,
  "message": "La imagen de portada es obligatoria"
}
```

### Error de validación — `400`

```json
{
  "success": false,
  "message": "Error de validación",
  "error": [
    {
      "path": ["precios"],
      "message": "El formato de los precios no es válido"
    }
  ]
}
```

---

# `PUT /api/productos/product/:id`

Actualiza parcialmente un producto existente.

Requiere autenticación y permite reemplazar la imagen de portada mediante el campo `imagen`.

> **Importante:** este endpoint **no recibe ni actualiza un campo `precio` individual**. Los precios se manejan mediante `precios_productos` y la operación correspondiente para agregar o modificar precios.

## Parámetro

| Parámetro | Tipo     | Obligatorio | Descripción      |
| --------- | -------- | ----------: | ---------------- |
| `id`      | `string` |          Sí | ID del producto. |

## Campos actualizables

| Campo                  | Tipo procesado | Descripción                       |
| ---------------------- | -------------- | --------------------------------- |
| `nombre`               | `string`       | Nuevo nombre.                     |
| `descripcion`          | `string`       | Nueva descripción.                |
| `descuento_porcentaje` | `number`       | Nuevo descuento.                  |
| `stock`                | `number`       | Nuevo stock.                      |
| `estado`               | `boolean`      | Estado del producto.              |
| `imagen`               | `File`         | Nueva imagen de portada opcional. |

Los campos omitidos conservan su valor actual.

## Conversión de datos

- `descuento_porcentaje` se convierte mediante `Number()`.
- `stock` se convierte mediante `Number()`.
- `estado` acepta el booleano `true` o la cadena `"true"`.
- Si no se proporciona una imagen nueva, se conserva `imagen_url`.

## Consulta utilizada

```sql
UPDATE productos
SET
  nombre = COALESCE($2, nombre),
  descripcion = COALESCE($3, descripcion),
  descuento_porcentaje = COALESCE($4, descuento_porcentaje),
  imagen_url = COALESCE($5, imagen_url),
  stock = COALESCE($6, stock),
  estado = COALESCE($7, estado)
WHERE id = $1
RETURNING *;
```

Parámetros:

| Posición | Parámetro              | Tipo      |
| -------: | ---------------------- | --------- |
|     `$1` | `id`                   | `string`  |
|     `$2` | `nombre`               | `string`  |
|     `$3` | `descripcion`          | `string`  |
|     `$4` | `descuento_porcentaje` | `number`  |
|     `$5` | `imagen_url`           | `string`  |
|     `$6` | `stock`                | `number`  |
|     `$7` | `estado`               | `boolean` |

Este endpoint no modifica directamente:

- `precios_productos`
- `producto_categorias`
- `producto_imagenes`

## Ejemplo

```text
PUT /api/productos/product/producto-id

nombre: Camiseta deportiva premium
descripcion: Camiseta deportiva de alta calidad
descuento_porcentaje: 15
stock: 30
estado: true
imagen: camiseta-nueva.jpg
```

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
    "imagen_url": "http://localhost:5000/uploads/productos/nueva.jpg"
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

# `DELETE /api/productos/product/:id`

Elimina un producto.

Requiere autenticación.

## Ejemplo

```http
DELETE /api/productos/product/producto-id
```

## Proceso

1. Obtiene el ID.
2. Verifica que exista.
3. Elimina el producto mediante `eliminarProducto()`.
4. Retorna una confirmación.

## Consulta utilizada

```sql
DELETE FROM productos
WHERE id = $1;
```

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

## Consultar categorías

```sql
SELECT c.id, c.nombre, c.descripcion
FROM categorias c
JOIN producto_categorias pc ON c.id = pc.categoria_id
WHERE pc.producto_id = $1;
```

Parámetro:

```text
producto_id: string
```

## Desasociar categorías

```sql
DELETE FROM producto_categorias
WHERE producto_id = $1;
```

Esta operación elimina únicamente las asociaciones, no las categorías.

## Consultar galería

```sql
SELECT id, url, es_principal, creado_en
FROM producto_imagenes
WHERE producto_id = $1
ORDER BY es_principal DESC, creado_en ASC;
```

---

# Almacenamiento de imágenes

Las imágenes se almacenan en:

```text
/uploads/productos/
```

La imagen de portada se almacena en:

```text
productos.imagen_url
```

Las imágenes adicionales se almacenan en:

```text
producto_imagenes
```

---

# Middlewares utilizados

## `authMiddleware`

Protege las operaciones que modifican productos:

```ts
router.post("/product", authMiddleware, ...);
router.put("/product/:id", authMiddleware, ...);
router.delete("/product/:id", authMiddleware, ...);
```

## `handleProductoUpload`

Procesa las imágenes enviadas mediante `multipart/form-data`.

Se utiliza en la creación y actualización del producto.

Campos procesados:

```text
imagen
galeria
```

---

# Rutas completas

```ts
router.post("/product", authMiddleware, handleProductoUpload, (req, res) =>
  ProductController.createProducto(req, res),
);

router.put("/product/:id", authMiddleware, handleProductoUpload, (req, res) =>
  ProductController.updateProducto(req, res),
);

router.delete("/product/:id", authMiddleware, (req, res) =>
  ProductController.deleteProducto(req, res),
);

router.get("/product/:id", (req, res) =>
  ProductController.getProductoPorId(req, res),
);

router.get("/products", (req, res) => ProductController.getProductos(req, res));
```

> Los campos obligatorios y las restricciones específicas dependen de los esquemas utilizados por `validateCrearProducto()` y `validateActualizarProducto()`.

---

# Flujo de creación

```text
multipart/form-data
        ↓
Obtener imagen y galería
        ↓
Convertir JSON y números
        ↓
Validar datos
        ↓
Crear producto
        ↓
Agregar precio Detal
        ↓
Agregar precio Mayor
        ↓
Agregar precio GranMayor
        ↓
Asociar categorías
        ↓
Guardar imágenes de galería
        ↓
Retornar producto creado
```

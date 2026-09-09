# 📦 Documentación — Productos

Este módulo contiene el CRUD de productos.

## Resumen de endpoints

| Método | Endpoint | Auth | Descripción |
|---|---|---:|---|
| `GET` | `/api/productos/products` | ❌ | Obtener todos los productos |
| `GET` | `/api/productos/product/:id` | ❌ | Obtener un producto por ID |
| `POST` | `/api/productos/product` | ✅ | Crear un producto |
| `PUT` | `/api/productos/product/:id` | ✅ | Actualizar un producto |
| `DELETE` | `/api/productos/product/:id` | ✅ | Eliminar un producto |

---

# `GET /api/productos/products`

Obtiene la lista completa de productos.

### Autenticación

No requiere autenticación.

### Ejemplo

```http
GET /api/productos/products
```

### Respuesta — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "nombre": "Producto de ejemplo",
      "descripcion": "Descripción del producto",
      "precio": 99.99,
      "stock": 10,
      "imagen_url": "http://localhost:3000/uploads/productos/producto.jpg"
    }
  ]
}
```

### Error — `500`

```json
{
  "success": false,
  "message": "Error al obtener la lista de productos"
}
```

---

# `GET /api/productos/product/:id`

Obtiene un producto específico.

## Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `string` | Sí | ID del producto |

### Ejemplo

```http
GET /api/productos/product/1
```

### Respuesta — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "1",
    "nombre": "Producto de ejemplo",
    "descripcion": "Descripción del producto",
    "precio": 99.99,
    "stock": 10,
    "imagen_url": "http://localhost:3000/uploads/productos/producto.jpg"
  }
}
```

### Errores

`400 Bad Request`

```json
{
  "success": false,
  "message": "El parámetro ID es requerido"
}
```

`404 Not Found`

```json
{
  "success": false,
  "message": "Producto no encontrado"
}
```

`500 Internal Server Error`

```json
{
  "success": false,
  "message": "Error al obtener el producto"
}
```

---

# `POST /api/productos/product`

Crea un nuevo producto utilizando `multipart/form-data`.

Permite subir una imagen de portada obligatoria y múltiples imágenes para la galería.

## Autenticación

Requiere `authMiddleware`.

## Content-Type

```http
Content-Type: multipart/form-data
```

## Archivos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `imagen` | `File` | Sí | Imagen principal |
| `galeria` | `File[]` | No | Imágenes adicionales |

## Campos

| Campo | Tipo recibido | Obligatorio | Descripción |
|---|---|---|---|
| `nombre` | `string` | Según validación | Nombre |
| `descripcion` | `string` | Según validación | Descripción |
| `precios` | `JSON string` | Según validación | Array de precios |
| `descuento_porcentaje` | `string → number` | No | Descuento |
| `stock` | `string → number` | Según validación | Stock |
| `categorias_ids` | `JSON string` | Según validación | Categorías |

Las restricciones definitivas son determinadas por:

```ts
Validator.validateProducto();
```

## Ejemplo con `form-data`

```text
nombre: Camiseta deportiva
descripcion: Camiseta deportiva de alta calidad

precios: [
  {"tipo_precio": "Detal", "precio": 25.00},
  {"tipo_precio": "Mayor", "precio": 20.00},
  {"tipo_precio": "GranMayor", "precio": 18.00}
]

descuento_porcentaje: 10
stock: 25
categorias_ids: [1, 3]

imagen: camiseta.jpg
galeria: camiseta-frente.jpg
galeria: camiseta-atras.jpg
```

### Conversión de datos

`precios`:

```ts
JSON.parse(request.body.precios);
```

`categorias_ids`:

```ts
JSON.parse(request.body.categorias_ids);
```

`descuento_porcentaje`:

```ts
Number(request.body.descuento_porcentaje);
```

`stock`:

```ts
Number(request.body.stock);
```

### Proceso

1. Recibe `multipart/form-data`.
2. Obtiene la imagen principal.
3. Obtiene la galería.
4. Verifica que exista una portada.
5. Convierte `precios`.
6. Convierte `categorias_ids`.
7. Convierte descuento y stock.
8. Valida los datos.
9. Construye la URL pública de la portada.
10. Crea el producto.
11. Guarda las imágenes secundarias.
12. Retorna `201 Created`.

### Respuesta — `201 Created`

```json
{
  "success": true,
  "message": "Producto creado exitosamente con su galería",
  "data": {
    "id": "1",
    "nombre": "Camiseta deportiva",
    "descripcion": "Camiseta deportiva de alta calidad",
    "imagen_url": "http://localhost:3000/uploads/productos/camiseta.jpg"
  }
}
```

### Errores

Imagen obligatoria:

```json
{
  "success": false,
  "message": "La imagen de portada es obligatoria"
}
```

Error de validación:

```json
{
  "success": false,
  "message": "Error de validación",
  "error": [
    {
      "path": ["nombre"],
      "message": "El nombre es requerido"
    }
  ]
}
```

### Notas

- `imagen` es obligatoria.
- `galeria` es opcional.
- Se pueden enviar múltiples archivos en `galeria`.
- `precios` debe ser JSON válido.
- `categorias_ids` debe ser JSON válido.
- Las imágenes secundarias no se guardan en `imagen_url`.

---

# `PUT /api/productos/product/:id`

Actualiza un producto existente.

También permite reemplazar la imagen de portada.

## Autenticación

Requiere `authMiddleware`.

## Parámetro

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `string` | Sí | ID del producto |

## Campos documentados

| Campo | Tipo |
|---|---|
| `nombre` | `string` |
| `descripcion` | `string` |
| `precio` | `number` |
| `descuento_porcentaje` | `number` |
| `stock` | `number` |
| `estado` | `boolean` |
| `imagen` | `File` |

La validación se realiza mediante:

```ts
Validator.validateActualizarProducto();
```

### Ejemplo

```text
PUT /api/productos/product/1

nombre: Camiseta deportiva premium
precio: 34.99
stock: 30
estado: true
```

### Proceso

1. Obtiene el ID.
2. Obtiene los datos.
3. Convierte valores numéricos.
4. Convierte `estado`.
5. Valida.
6. Comprueba que exista el producto.
7. Mantiene la imagen actual si no hay una nueva.
8. Genera una URL nueva si se proporciona imagen.
9. Actualiza.
10. Retorna el producto actualizado.

### Respuesta

```json
{
  "success": true,
  "message": "Producto actualizado exitosamente",
  "data": {
    "id": "1",
    "nombre": "Camiseta deportiva premium",
    "precio": 34.99,
    "stock": 30,
    "imagen_url": "http://localhost:3000/uploads/productos/camiseta-nueva.jpg"
  }
}
```

---

# `DELETE /api/productos/product/:id`

Elimina un producto.

## Autenticación

Requiere `authMiddleware`.

### Ejemplo

```http
DELETE /api/productos/product/1
```

### Proceso

1. Obtiene el ID.
2. Verifica que exista.
3. Busca el producto.
4. Comprueba que exista.
5. Elimina mediante `eliminarProducto()`.
6. Retorna una confirmación.

### Respuesta

```json
{
  "success": true,
  "message": "Producto eliminado exitosamente"
}
```

### Errores

```json
{
  "success": false,
  "message": "El parámetro ID es requerido"
}
```

```json
{
  "success": false,
  "message": "Producto no encontrado"
}
```

```json
{
  "success": false,
  "message": "Error al eliminar el producto"
}
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

Se utiliza en creación y actualización.

Los campos son:

```text
imagen
galeria
```

Las imágenes se almacenan bajo:

```text
/uploads/productos/
```

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

router.get("/products", (req, res) =>
  ProductController.getProductos(req, res),
);
```

> Los campos obligatorios y restricciones específicas dependen de los esquemas utilizados por `Validator.validateProducto()` y `Validator.validateActualizarProducto()`.

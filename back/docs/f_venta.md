# Fuerza de Venta — Presupuestos

## Descripción general

Este módulo permite crear, consultar, actualizar el estado y eliminar
presupuestos. La ruta base del módulo es `/presupuestos`.

Todas las rutas requieren uno de estos roles:

- `ADMIN`
- `F_VENTAS`

Los presupuestos se crean con una cabecera y una lista de productos
detallados. El identificador del presupuesto es opcional: si no se envía, el
servidor genera uno automáticamente.

## Resumen de endpoints

| Método   | Ruta                       | Se envía                                       | Se recibe                                   |
| -------- | -------------------------- | ---------------------------------------------- | ------------------------------------------- |
| `POST`   | `/presupuestos`            | Cabecera y detalles del presupuesto en el body | Presupuesto creado, incluyendo sus detalles |
| `GET`    | `/presupuestos`            | Nada                                           | Lista de presupuestos                       |
| `PATCH`  | `/presupuestos/:id/estado` | `id` en la URL y `estado` en el body           | Presupuesto con el estado actualizado       |
| `GET`    | `/presupuestos/:id`        | `id` en la URL                                 | Presupuesto solicitado con sus detalles     |
| `DELETE` | `/presupuestos/:id`        | `id` en la URL                                 | Confirmación de eliminación                 |

Las respuestas exitosas utilizan la propiedad `success`. Cuando corresponde,
los datos se entregan en la propiedad `data`.

---

## Crear un presupuesto

### `POST /presupuestos`

El body debe ser un objeto JSON con la información del cliente, los totales y
al menos un producto.

### Datos enviados

| Campo              | Tipo     | Obligatorio | Reglas                                                                        |
| ------------------ | -------- | ----------- | ----------------------------------------------------------------------------- |
| `id`               | `string` | No          | Si se envía, debe ser un UUID válido. Si se omite, se genera automáticamente. |
| `nombre_cliente`   | `string` | Sí          | Debe tener al menos 2 caracteres.                                             |
| `telefono_cliente` | `string` | No          | Teléfono del cliente.                                                         |
| `descuento`        | `number` | No          | Debe ser mayor o igual a `0`. Si se omite, se guarda como `0`.                |
| `total`            | `number` | Sí          | Debe ser mayor que `0`.                                                       |
| `detalles`         | `array`  | Sí          | Debe contener al menos un producto.                                           |

Cada elemento de `detalles` debe contener:

| Campo             | Tipo      | Obligatorio | Reglas                            |
| ----------------- | --------- | ----------- | --------------------------------- |
| `producto_id`     | `string`  | Sí          | Debe ser un UUID válido.          |
| `cantidad`        | `integer` | Sí          | Debe ser un entero mayor que `0`. |
| `precio_unitario` | `number`  | Sí          | Debe ser mayor que `0`.           |
| `tipo_precio`     | `string`  | Sí          | No puede estar vacío.             |

### Ejemplo de request

```http
POST /presupuestos
Content-Type: application/json
```

```json
{
  "nombre_cliente": "Comercial El Sol",
  "telefono_cliente": "04141234567",
  "descuento": 50,
  "total": 1250.5,
  "detalles": [
    {
      "producto_id": "550e8400-e29b-41d4-a716-446655440000",
      "cantidad": 2,
      "precio_unitario": 650.25,
      "tipo_precio": "Mayor"
    }
  ]
}
```

También se puede enviar un `id` propio:

```json
{
  "id": "7f1d4b8e-1a2b-4c3d-9e5f-60718293a4b5",
  "nombre_cliente": "Comercial El Sol",
  "total": 1250.5,
  "detalles": [
    {
      "producto_id": "550e8400-e29b-41d4-a716-446655440000",
      "cantidad": 2,
      "precio_unitario": 650.25,
      "tipo_precio": "Mayor"
    }
  ]
}
```

### Datos recibidos — `201 Created`

El servidor responde con el presupuesto creado en `data`. El repositorio
inserta la cabecera y cada detalle, y luego consulta nuevamente el presupuesto
completo; por ello, `data` contiene la información de la cabecera y sus
detalles anidados.

```json
{
  "success": true,
  "message": "Presupuesto creado exitosamente",
  "data": {
    "id": "7f1d4b8e-1a2b-4c3d-9e5f-60718293a4b5",
    "nombre_cliente": "Comercial El Sol",
    "telefono_cliente": "04141234567",
    "descuento": 50,
    "total": 1250.5,
    "detalles": [
      {
        "producto_id": "550e8400-e29b-41d4-a716-446655440000",
        "cantidad": 2,
        "precio_unitario": 650.25,
        "tipo_precio": "Mayor"
      }
    ]
  }
}
```

> La consulta de respuesta puede incluir otros campos calculados o
> relacionados por la base de datos. Los campos enviados por el cliente son
> los descritos en las tablas anteriores.

### Errores de creación — `500 Internal Server Error`

Si ocurre un error en el repositorio o en la creación de la cabecera o de sus
detalles, el controlador responde:

```json
{
  "success": false,
  "message": "Error al crear presupuesto",
  "error": "Descripción del error"
}
```

Los valores inválidos deben corregirse según las reglas de validación
indicadas. Por ejemplo, no se puede enviar un `producto_id` que no sea UUID,
un `total` igual o menor que cero, ni un arreglo `detalles` vacío.

---

## Listar presupuestos

### `GET /presupuestos`

### Datos enviados

No requiere body, parámetros de ruta ni query parameters.

### Datos recibidos — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "7f1d4b8e-1a2b-4c3d-9e5f-60718293a4b5",
      "nombre_cliente": "Comercial El Sol",
      "telefono_cliente": "04141234567",
      "descuento": 50,
      "total": 1250.5,
      "detalles": [
        {
          "producto_id": "550e8400-e29b-41d4-a716-446655440000",
          "cantidad": 2,
          "precio_unitario": 650.25,
          "tipo_precio": "Mayor"
        }
      ]
    }
  ]
}
```

Si no existen presupuestos, `data` es un arreglo vacío.

### Error — `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Error al obtener presupuestos",
  "error": "Descripción del error"
}
```

---

## Actualizar el estado

### `PATCH /presupuestos/:id/estado`

### Datos enviados

El `id` se envía como parámetro de la URL y el body debe contener únicamente
el estado nuevo:

```http
PATCH /presupuestos/7f1d4b8e-1a2b-4c3d-9e5f-60718293a4b5/estado
Content-Type: application/json
```

```json
{
  "estado": "vendido"
}
```

Los únicos estados permitidos son:

- `proceso`
- `vendido`
- `cancelado`

### Datos recibidos — `200 OK`

```json
{
  "success": true,
  "message": "Estado actualizado",
  "data": {
    "id": "7f1d4b8e-1a2b-4c3d-9e5f-60718293a4b5",
    "estado": "vendido"
  }
}
```

`data` contiene el registro devuelto por la consulta de actualización y puede
incluir también los demás campos del presupuesto.

### Presupuesto no encontrado — `404 Not Found`

```json
{
  "success": false,
  "message": "Presupuesto no encontrado"
}
```

### Error — `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Error al actualizar estado",
  "error": "Descripción del error"
}
```

---

## Obtener un presupuesto

### `GET /presupuestos/:id`

### Datos enviados

Solo se envía el identificador como parámetro de ruta:

```http
GET /presupuestos/7f1d4b8e-1a2b-4c3d-9e5f-60718293a4b5
```

### Datos recibidos — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "7f1d4b8e-1a2b-4c3d-9e5f-60718293a4b5",
    "nombre_cliente": "Comercial El Sol",
    "telefono_cliente": "04141234567",
    "descuento": 50,
    "total": 1250.5,
    "detalles": [
      {
        "producto_id": "550e8400-e29b-41d4-a716-446655440000",
        "cantidad": 2,
        "precio_unitario": 650.25,
        "tipo_precio": "Mayor"
      }
    ]
  }
}
```

### Presupuesto no encontrado — `404 Not Found`

```json
{
  "success": false,
  "message": "Presupuesto no encontrado"
}
```

### Error — `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Error al obtener el presupuesto",
  "error": "Descripción del error"
}
```

---

## Eliminar un presupuesto

### `DELETE /presupuestos/:id`

### Datos enviados

Solo se envía el identificador como parámetro de ruta:

```http
DELETE /presupuestos/7f1d4b8e-1a2b-4c3d-9e5f-60718293a4b5
```

### Datos recibidos — `200 OK`

```json
{
  "success": true,
  "message": "Presupuesto eliminado exitosamente"
}
```

### Presupuesto no encontrado — `404 Not Found`

```json
{
  "success": false,
  "message": "Presupuesto no encontrado"
}
```

### Error — `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Error al eliminar presupuesto",
  "error": "Descripción del error"
}
```

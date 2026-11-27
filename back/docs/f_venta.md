# Fuerza de Venta — Presupuestos

## Descripción general

Este módulo permite crear, consultar, editar, actualizar el estado y eliminar
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
| `PATCH`  | `/presupuestos/:id`        | `id` en la URL y campos opcionales en el body  | Presupuesto actualizado, incluyendo detalles |
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
| `descuento`        | `number` | No          | Porcentaje entre `0` y `100`. Si se omite, se usa `0`.                        |
| `total`            | `number` | No          | Se recalcula en el servidor; el valor enviado, si existe, se ignora.          |
| `detalles`         | `array`  | Sí          | Debe contener al menos un producto.                                           |

Cada elemento de `detalles` debe contener:

| Campo             | Tipo      | Obligatorio | Reglas                            |
| ----------------- | --------- | ----------- | --------------------------------- |
| `producto_id`     | `string`  | Sí          | Debe ser un UUID válido.          |
| `cantidad`        | `integer` | Sí          | Debe ser un entero mayor que `0`. |
| `precio_unitario` | `number`  | No          | Si se envía, el servidor lo reemplaza por el precio del catálogo. |
| `tipo_precio`     | `string`  | Sí          | `detal_usd`, `detal_bs`, `Mayor` o `GranMayor`; debe existir en el producto. |

### Ejemplo de request

```http
POST /presupuestos
Content-Type: application/json
```

```json
{
  "nombre_cliente": "Comercial El Sol",
  "telefono_cliente": "04141234567",
  "descuento": 10,
  "detalles": [
    {
      "producto_id": "550e8400-e29b-41d4-a716-446655440000",
      "cantidad": 2,
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
  "detalles": [
    {
      "producto_id": "550e8400-e29b-41d4-a716-446655440000",
      "cantidad": 2,
      "tipo_precio": "Mayor"
    }
  ]
}
```

El servidor calcula el `precio_unitario` desde el catálogo según el tipo
solicitado y recalcula `total` sumando los subtotales, con el porcentaje de
descuento aplicado. No se utilizan los valores de `precio_unitario` ni `total`
enviados por el cliente.

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
    "descuento": 10,
    "total": 1170.45,
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

### Tipo de precio no disponible — `400 Bad Request`

Si el producto no tiene registrado en el catálogo el `tipo_precio` solicitado,
el presupuesto no se crea.

### Producto no encontrado — `404 Not Found`

Si alguno de los productos no existe, el presupuesto no se crea.

### Error de creación — `500 Internal Server Error`

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
      "descuento": 10,
      "total": 1170.45,
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

## Editar un presupuesto

### `PATCH /presupuestos/:id`

Permite modificar datos de la cabecera y reemplazar los detalles existentes del
presupuesto. Todos los campos del body son opcionales.

### Datos enviados

El `id` se envía como parámetro de la URL. Los datos opcionales se envían en el
body:

```http
PATCH /presupuestos/7f1d4b8e-1a2b-4c3d-9e5f-60718293a4b5
Content-Type: application/json
```

| Campo              | Tipo      | Obligatorio | Reglas                                                       |
| ------------------ | --------- | ----------- | ------------------------------------------------------------ |
| `nombre_cliente`   | `string`  | No          | Debe tener al menos 2 caracteres.                            |
| `telefono_cliente` | `string`  | No          | Teléfono del cliente. Puede omitirse para conservar el actual. |
| `descuento`        | `number`  | No          | Debe estar entre `0` y `100`.                                |
| `total`            | `number`  | No          | Se recalcula desde el catálogo si se envían detalles; si no, puede actualizarse. |
| `estado`           | `string`  | No          | Solo acepta `proceso`, `vendido` o `cancelado`.              |
| `detalles`         | `array`   | No          | Si se incluye, debe contener al menos un producto.           |

Cada elemento de `detalles` debe tener este formato:

| Campo             | Tipo      | Obligatorio | Reglas                                                                 |
| ----------------- | --------- | ----------- | ---------------------------------------------------------------------- |
| `producto_id`     | `string`  | Sí          | Identificador del producto.                                           |
| `cantidad`        | `number`  | Sí          | Debe ser mayor que `0`.                                                |
| `precio_unitario` | `number`  | No          | Se reemplaza por el precio del catálogo correspondiente a `tipo_precio`. |
| `tipo_precio`     | `string`  | Sí, si se envían detalles | `detal_usd`, `detal_bs`, `Mayor` o `GranMayor`; debe existir en el producto. |

Ejemplo con edición completa:

```json
{
  "nombre_cliente": "Comercial El Sol C.A.",
  "telefono_cliente": "04141234567",
  "descuento": 10,
  "total": 900,
  "estado": "proceso",
  "detalles": [
    {
      "producto_id": "550e8400-e29b-41d4-a716-446655440000",
      "cantidad": 6,
      "tipo_precio": "Mayor"
    },
    {
      "producto_id": "660e8400-e29b-41d4-a716-446655440001",
      "cantidad": 2,
      "precio_unitario": 25,
      "tipo_precio": "detal_usd"
    }
  ]
}
```

También puede enviarse una edición parcial:

```json
{
  "telefono_cliente": "04241234567",
  "estado": "vendido"
}
```

Comportamiento de `detalles`:

- Si se envía `detalles`, reemplaza todos los detalles anteriores.
- Antes de reemplazar los detalles, se verifica que exista cada producto.
- El servidor obtiene el precio unitario desde el catálogo según el
  `tipo_precio` solicitado. Si el producto no tiene ese tipo, la edición falla
  con un error `400`; no se usa otro tipo como fallback.
- Si se envían detalles, el servidor siempre recalcula el total a partir de los
  precios del catálogo y aplica el descuento enviado o el descuento actual;
  ignora el `total` del cliente.
- Si no se envían detalles, se puede actualizar `total` directamente.

### Datos recibidos — `200 OK`

```json
{
  "message": "Presupuesto actualizado correctamente",
  "data": {
    "id": "7f1d4b8e-1a2b-4c3d-9e5f-60718293a4b5",
    "nombre_cliente": "Comercial El Sol C.A.",
    "telefono_cliente": "04141234567",
    "descuento": 10,
    "total": 900,
    "estado": "proceso",
    "detalles": [
      {
        "id_detalle": "a10e8400-e29b-41d4-a716-446655440010",
        "producto_id": "550e8400-e29b-41d4-a716-446655440000",
        "cantidad": 6,
        "precio_unitario": 80,
        "tipo_precio": "Mayor"
      }
    ]
  }
}
```

### Datos inválidos — `400 Bad Request`

```json
{
  "message": "Datos inválidos para editar el presupuesto",
  "errors": {
    "formErrors": [],
    "fieldErrors": {
      "descuento": ["El número debe ser mayor o igual a 0"]
    }
  }
}
```

La respuesta `errors` puede variar según el campo que falle.

### ID del presupuesto obligatorio — `400 Bad Request`

Esto ocurre si la ruta no incluye el identificador:

```json
{
  "message": "El id del presupuesto es obligatorio"
}
```

### Presupuesto no encontrado — `404 Not Found`

```json
{
  "message": "Presupuesto no encontrado"
}
```

### Producto no encontrado — `404 Not Found`

```json
{
  "message": "Producto con ID 550e8400-e29b-41d4-a716-446655440000 no encontrado"
}
```

### Error — `500 Internal Server Error`

```json
{
  "message": "Error interno al editar el presupuesto"
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
    "descuento": 10,
    "total": 1170.45,
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

---

## Enviar presupuesto por WhatsApp

### `POST /presupuestos/enviar`

### Datos enviados

Se envían los datos en el body de la solicitud. El campo `presupuestoId` es obligatorio y `telefonoSolicitado` es opcional.

```http
POST /presupuestos/enviar
Content-Type: application/json
```

```json
{
  "presupuestoId": "507785b7-16d4-4c42-8cd3-c8a1b9a7a16a",
  "telefonoSolicitado": "04125040788"
}
```

**Descripción de los campos:**

- `presupuestoId`: identificador único del presupuesto que se desea enviar.
- `telefonoSolicitado`: número de teléfono al que se generará el enlace de WhatsApp. Es opcional.

Si no se proporciona `telefonoSolicitado`, el sistema utiliza el teléfono registrado en el presupuesto. Si tampoco existe, utiliza el número configurado en `WHATSAPP_EMPRESA` o, como último recurso, `584129668437`.

El número de teléfono se normaliza automáticamente: si comienza con `0`, se reemplaza por el prefijo `58`.

### Datos recibidos — `200 OK`

Si el presupuesto existe, tiene productos asociados y todos los productos se encuentran registrados, se genera un enlace de WhatsApp con el mensaje del presupuesto.

```json
{
  "success": true,
  "message": "Enlace de WhatsApp generado exitosamente",
  "data": {
    "presupuestoId": "507785b7-16d4-4c42-8cd3-c8a1b9a7a16a",
    "telefono": "584125040788",
    "whatsappUrl": "https://wa.me/584125040788?text=Hola%20Cliente...",
    "mensaje": "Hola Cliente, somos *Tu Sitio Import* y este es tu presupuesto:\n\n📋 *Presupuesto Nro.:* 507785B7\n\n🛒 *Productos:*\n• 1x DISPENSADOR - $2.00\n• 1x MASAJEADOR PULPO - $1.00\n\n💰 *Total:* $3.00\n\nSi tienes alguna duda, haznos saber."
  }
}
```

**Descripción de los campos recibidos:**

- `success`: indica si la operación se realizó correctamente.
- `message`: mensaje descriptivo del resultado.
- `data.presupuestoId`: identificador del presupuesto enviado.
- `data.telefono`: número de teléfono normalizado al que se generó el enlace.
- `data.whatsappUrl`: enlace directo de WhatsApp que permite abrir una conversación con el mensaje del presupuesto previamente cargado.
- `data.mensaje`: contenido del mensaje generado con la información del presupuesto, incluyendo cliente, productos, cantidades, subtotales y total.

**Importante:** Este endpoint genera el enlace de WhatsApp, pero no envía automáticamente el mensaje. El usuario debe abrir el enlace y confirmar el envío desde WhatsApp.

### ID del presupuesto obligatorio — `400 Bad Request`

Si no se proporciona el identificador del presupuesto:

```json
{
  "success": false,
  "message": "El ID del presupuesto es obligatorio"
}
```

### Presupuesto no encontrado — `404 Not Found`

Si el identificador enviado no corresponde a ningún presupuesto registrado:

```json
{
  "success": false,
  "message": "Presupuesto no encontrado"
}
```

### Presupuesto sin productos — `400 Bad Request`

Si el presupuesto existe, pero no tiene productos asociados:

```json
{
  "success": false,
  "message": "El presupuesto no tiene productos asociados"
}
```

### Producto no encontrado — `404 Not Found`

Si alguno de los productos asociados al presupuesto no existe:

```json
{
  "success": false,
  "message": "Producto con ID 550e8400-e29b-41d4-a716-446655440000 no encontrado"
}
```

El identificador mostrado corresponde al producto que no pudo localizarse.

### Error — `500 Internal Server Error`

Si ocurre un error durante la consulta del presupuesto, la verificación de productos o la generación del enlace de WhatsApp:

```json
{
  "success": false,
  "message": "Error al generar el envío del presupuesto por WhatsApp",
  "error": "Descripción del error"
}
```

`error` contiene la descripción del error generado durante la ejecución del proceso.

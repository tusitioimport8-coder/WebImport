# 📋 Endpoints de Fuerza de Venta — Presupuestos

## Descripción general

El módulo de Fuerza de Venta permite crear presupuestos, consultar los presupuestos registrados y actualizar su estado.

Los presupuestos se almacenan en la tabla `pedidos`, identificándose mediante el campo `tipo_documento` con el valor `presupuesto`.

## Resumen de endpoints

| Método   | Endpoint                   | Descripción                            |
| -------- | -------------------------- | -------------------------------------- |
| `POST`   | `/presupuestos`            | Crear un presupuesto                   |
| `GET`    | `/presupuestos`            | Listar todos los presupuestos          |
| `PATCH`  | `/presupuestos/:id/estado` | Actualizar el estado de un presupuesto |
| `GET`    | `/presupuestos/:id`        | Obtener un presupuesto por su ID       |
| `DELETE` | `/presupuestos/:id`        | Eliminar un presupuesto por su ID      |

> Las rutas anteriores representan los endpoints documentados a partir de los métodos del controlador. La ruta base y los paths definitivos deben coincidir con la configuración del router del proyecto.

---

# `POST /presupuestos`

Permite crear un nuevo presupuesto asociado a un usuario.

El identificador del presupuesto se genera automáticamente utilizando `crypto.randomUUID()`, con el prefijo `presupuesto-`.

## Request Body

| Campo        | Tipo     | Obligatorio | Descripción                                       |
| ------------ | -------- | ----------- | ------------------------------------------------- |
| `usuario_id` | `string` | Sí\*        | Identificador del usuario asociado al presupuesto |
| `total`      | `number` | Sí\*        | Importe total del presupuesto                     |

\* El controlador obtiene estos campos del body, pero no realiza una validación explícita de su obligatoriedad.

## Ejemplo

```json
{
  "usuario_id": "123",
  "total": 1500.5
}
```

## Proceso

1. Recibe el identificador del usuario y el total desde el body.
2. Genera un identificador único con el formato `presupuesto-{UUID}`.
3. Construye el objeto del nuevo presupuesto.
4. Llama a `repo.crearPresupuesto()` para guardar el registro.
5. Retorna una respuesta con los datos del presupuesto creado.

## Respuesta exitosa — `201 Created`

```json
{
  "success": true,
  "message": "Presupuesto creado exitosamente",
  "data": {
    "id": "presupuesto-uuid-generado",
    "usuario_id": "123",
    "total": 1500.5,
    "estado": "emitido",
    "tipo_documento": "presupuesto"
  }
}
```

La estructura de `data` es ilustrativa: el objeto real depende de las columnas que devuelva el repositorio.

## Errores

### `500 Internal Server Error`

Si ocurre un error al crear el presupuesto:

```json
{
  "success": false,
  "message": "Error al crear presupuesto",
  "details": "Descripción del error"
}
```

---

# `GET /presupuestos`

Permite obtener todos los presupuestos registrados.

El repositorio consulta únicamente los registros cuyo `tipo_documento` es `presupuesto` y los ordena por fecha de creación, del más reciente al más antiguo.

## Parámetros

No requiere parámetros de ruta, query string ni body según el controlador proporcionado.

## Ejemplo

```http
GET /presupuestos
```

## Proceso

1. Recibe la petición.
2. Llama a `repo.listarPresupuestos()`.
3. Obtiene los presupuestos registrados.
4. Retorna la lista en la propiedad `data`.

## Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "presupuesto-uuid-generado",
      "usuario_id": "123",
      "total": 1500.5,
      "estado": "emitido",
      "tipo_documento": "presupuesto"
    },
    {
      "id": "presupuesto-otro-uuid",
      "usuario_id": "456",
      "total": 2800,
      "estado": "emitido",
      "tipo_documento": "presupuesto"
    }
  ]
}
```

Los registros del ejemplo son ilustrativos. La respuesta real contiene los campos devueltos por el repositorio.

Si no existen presupuestos, el controlador devuelve una lista vacía en `data`, siempre que el repositorio retorne una lista vacía.

## Errores

### `500 Internal Server Error`

Si ocurre un error al consultar los presupuestos:

```json
{
  "success": false,
  "message": "Error al listar presupuestos",
  "details": "Descripción del error"
}
```

---

# `PATCH /presupuestos/:id/estado`

Permite actualizar el estado de un presupuesto existente mediante su identificador.

## Parámetros de ruta

| Parámetro | Tipo     | Obligatorio | Descripción                                      |
| --------- | -------- | ----------- | ------------------------------------------------ |
| `id`      | `string` | Sí          | Identificador del presupuesto que se actualizará |

## Request Body

| Campo    | Tipo     | Obligatorio | Descripción                  |
| -------- | -------- | ----------- | ---------------------------- |
| `estado` | `string` | Sí\*        | Nuevo estado del presupuesto |

\* El controlador obtiene `estado` del body, pero no valida explícitamente que esté presente ni restringe sus posibles valores.

## Ejemplo

```http
PATCH /presupuestos/presupuesto-123/estado
```

Body:

```json
{
  "estado": "aprobado"
}
```

El valor `aprobado` es un ejemplo. Los estados permitidos dependen de las reglas de negocio implementadas en el proyecto.

## Proceso

1. Obtiene el identificador del presupuesto desde `req.params.id`.
2. Obtiene el nuevo estado desde `req.body.estado`.
3. Convierte el identificador a `string`.
4. Llama a `repo.actualizarEstadoPresupuesto()`.
5. Si el repositorio no devuelve un presupuesto actualizado, responde con `404 Not Found`.
6. Si la actualización tiene éxito, retorna el registro actualizado.

## Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "message": "Estado del presupuesto actualizado correctamente",
  "data": {
    "id": "presupuesto-123",
    "estado": "aprobado"
  }
}
```

El contenido de `data` es ilustrativo y puede incluir otras columnas devueltas por el repositorio.

## Errores

### `404 Not Found`

Cuando no se encuentra el presupuesto o el repositorio no devuelve un registro actualizado:

```json
{
  "success": false,
  "message": "Presupuesto no encontrado"
}
```

### `500 Internal Server Error`

Si ocurre un error al actualizar el estado:

```json
{
  "success": false,
  "message": "Error al actualizar el estado del presupuesto",
  "details": "Descripción del error"
}
```

# `GET /presupuestos/:id`

Obtiene un presupuesto por su identificador.

## Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "presupuesto-123",
    "usuario_id": "123",
    "total": 1500.5,
    "estado": "emitido",
    "tipo_documento": "presupuesto"
  }
}
```

### `404 Not Found`

Si no existe un presupuesto con el identificador indicado:

```json
{
  "success": false,
  "message": "Presupuesto no encontrado"
}
```

### `500 Internal Server Error`

Si ocurre un error al obtener el presupuesto:

```json
{
  "success": false,
  "message": "Error al obtener el presupuesto",
  "details": "Descripción del error"
}
```

# `DELETE /presupuestos/:id`

Elimina un presupuesto por su identificador.

## Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "message": "Presupuesto eliminado correctamente"
}
```

### `404 Not Found`

Si no existe un presupuesto con el identificador indicado:

```json
{
  "success": false,
  "message": "Presupuesto no encontrado"
}
```

### `500 Internal Server Error`

Si ocurre un error al eliminar el presupuesto:

```json
{
  "success": false,
  "message": "Error al eliminar el presupuesto",
  "details": "Descripción del error"
}
```

---

## Resumen del módulo

| Operación            | Método del controlador      | Descripción                                                                               |
| -------------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| Crear presupuesto    | `crearPresupuesto()`        | Genera un ID y registra un presupuesto asociado a un usuario                              |
| Listar presupuestos  | `listarPresupuestos()`      | Consulta los registros de tipo `presupuesto`, ordenados por fecha de creación descendente |
| Cambiar estado       | `cambiarEstado()`           | Actualiza el estado de un presupuesto identificado por su ID                              |
| Obtener presupuesto  | `obtenerPresupuestoPorId()` | Recupera un presupuesto por su ID                                                         |
| Eliminar presupuesto | `eliminarPresupuesto()`     | Elimina un presupuesto por su ID                                                          |

## Consideraciones

- Los presupuestos se almacenan en la tabla `pedidos`.
- El identificador se genera automáticamente al crear un presupuesto.
- Al crearse, el registro utiliza el estado `emitido` y el tipo de documento `presupuesto`, según la operación del repositorio proporcionada.
- La consulta de listado devuelve únicamente documentos de tipo `presupuesto`.
- El controlador no especifica una lista de estados permitidos.
- El controlador mostrado no define middleware de autenticación o autorización; estos podrían estar configurados en el router.

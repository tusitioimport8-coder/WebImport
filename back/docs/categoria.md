# Documentación — Categorías

Este módulo administra las categorías de productos. Permite consultar,
crear, actualizar y eliminar registros de la tabla `categorias`.

## Características

- Obtener todas las categorías ordenadas alfabéticamente.
- Obtener una categoría por su identificador.
- Crear una categoría.
- Actualizar parcialmente una categoría.
- Eliminar una categoría.

## Modelo de datos

Las categorías utilizan los siguientes campos:

| Campo         | Tipo     | Descripción                          |
| ------------- | -------- | ------------------------------------ |
| `id`          | `number` | Identificador único de la categoría. |
| `nombre`      | `string` | Nombre de la categoría.              |
| `descripcion` | `string` | Descripción de la categoría.         |

## `obtenerCategorias`

Obtiene todas las categorías registradas y las ordena por nombre de forma
ascendente.

### Consulta utilizada

```sql
SELECT id, nombre, descripcion
FROM categorias
ORDER BY nombre ASC;
```

### Parámetros

Este método no requiere parámetros.

### Respuesta exitosa

HTTP `200`:

```json
[
  {
    "id": 1,
    "nombre": "Electrodomésticos",
    "descripcion": "Productos eléctricos para el hogar"
  },
  {
    "id": 2,
    "nombre": "Herramientas",
    "descripcion": "Herramientas manuales y eléctricas"
  }
]
```

### Cuando no existen categorías

Si la consulta no retorna registros, responde con HTTP `404`:

```json
{
  "error": "No se encontraron categorías"
}
```

## `obtenerCategoriaPorId`

Obtiene una categoría específica utilizando su identificador.

### Parámetro de ruta

| Parámetro | Tipo recibido | Descripción                                                            |
| --------- | ------------- | ---------------------------------------------------------------------- |
| `id`      | `string`      | Identificador de la categoría. El controlador lo convierte a `number`. |

### Consulta utilizada

```sql
SELECT id, nombre, descripcion
FROM categorias
WHERE id = $1;
```

### Orden de parámetros

| Posición | Parámetro | Tipo     |
| -------: | --------- | -------- |
|     `$1` | `id`      | `string` |

### Respuesta exitosa

HTTP `200`:

```json
{
  "id": 1,
  "nombre": "Electrodomésticos",
  "descripcion": "Productos eléctricos para el hogar"
}
```

### Categoría no encontrada

Si no existe una categoría con el identificador indicado, responde con HTTP
`404`:

```json
{
  "error": "Categoría no encontrada"
}
```

## `crearCategoria`

Registra una nueva categoría en la tabla `categorias`.

### Cuerpo de la solicitud

```json
{
  "nombre": "Electrodomésticos",
  "descripcion": "Productos eléctricos para el hogar"
}
```

| Campo         | Tipo     | Descripción                        |
| ------------- | -------- | ---------------------------------- |
| `nombre`      | `string` | Nombre de la nueva categoría.      |
| `descripcion` | `string` | Descripción de la nueva categoría. |

### Consulta utilizada

```sql
INSERT INTO categorias (nombre, descripcion)
VALUES ($1, $2)
RETURNING id, nombre, descripcion;
```

### Orden de parámetros

| Posición | Parámetro     | Tipo     |
| -------: | ------------- | -------- |
|     `$1` | `nombre`      | `string` |
|     `$2` | `descripcion` | `string` |

### Respuesta exitosa

HTTP `201`:

```json
{
  "id": 1,
  "nombre": "Electrodomésticos",
  "descripcion": "Productos eléctricos para el hogar"
}
```

## `actualizarCategoria`

Actualiza una categoría existente utilizando su identificador. La consulta
permite actualizar uno o ambos campos: cuando un valor es `NULL`, se conserva
el valor actual de la base de datos.

### Parámetro de ruta

| Parámetro | Tipo recibido | Descripción                                                            |
| --------- | ------------- | ---------------------------------------------------------------------- |
| `id`      | `string`      | Identificador de la categoría. El controlador lo convierte a `number`. |

### Cuerpo de la solicitud

```json
{
  "nombre": "Electrodomésticos para el hogar",
  "descripcion": "Productos eléctricos y accesorios"
}
```

Los campos `nombre` y `descripcion` se envían en el cuerpo de la solicitud.
La consulta utiliza `COALESCE`, por lo que un valor `NULL` conserva el valor
existente.

### Consulta utilizada

```sql
UPDATE categorias
SET
	nombre = COALESCE($2, nombre),
	descripcion = COALESCE($3, descripcion)
WHERE id = $1
RETURNING id, nombre, descripcion;
```

### Orden de parámetros

| Posición | Parámetro     | Tipo     |
| -------: | ------------- | -------- |
|     `$1` | `id`          | `string` |
|     `$2` | `nombre`      | `string` |
|     `$3` | `descripcion` | `string` |

### Respuesta exitosa

HTTP `200`:

```json
{
  "id": 1,
  "nombre": "Electrodomésticos para el hogar",
  "descripcion": "Productos eléctricos y accesorios"
}
```

### Categoría no encontrada

Si no existe una categoría con el identificador indicado, responde con HTTP
`404`:

```json
{
  "error": "Categoría no encontrada"
}
```

## `eliminarCategoria`

Elimina una categoría utilizando su identificador.

### Parámetro de ruta

| Parámetro | Tipo recibido | Descripción                                                            |
| --------- | ------------- | ---------------------------------------------------------------------- |
| `id`      | `string`      | Identificador de la categoría. El controlador lo convierte a `number`. |

### Proceso

1. Convierte el parámetro `id` a un número entero.
2. Solicita al repositorio la eliminación de la categoría.
3. Retorna una confirmación si la eliminación fue exitosa.

### Respuesta exitosa

HTTP `200`:

```json
{
  "message": "Categoría eliminada exitosamente"
}
```

### Categoría no encontrada

Si el repositorio no elimina ningún registro, responde con HTTP `404`:

```json
{
  "error": "Categoría no encontrada"
}
```

## Validaciones y errores

El controlador convierte los parámetros de ruta `id` con `parseInt`. No
realiza validaciones explícitas sobre `nombre` ni `descripcion`; esos datos se
envían al repositorio y las restricciones de la base de datos determinan si
son aceptados.

Todas las operaciones capturan los errores inesperados y responden con HTTP
`500`:

```json
{
  "error": "Error interno del servidor"
}
```

## Resumen de operaciones

| Método del controlador  | Operación                               | Estado exitoso |
| ----------------------- | --------------------------------------- | -------------: |
| `obtenerCategorias`     | Listar categorías ordenadas por nombre. |          `200` |
| `obtenerCategoriaPorId` | Consultar una categoría por ID.         |          `200` |
| `crearCategoria`        | Crear una categoría.                    |          `201` |
| `actualizarCategoria`   | Actualizar una categoría existente.     |          `200` |
| `eliminarCategoria`     | Eliminar una categoría existente.       |          `200` |

## Flujo general

```text
Solicitud HTTP
			↓
CategoriaController
			↓
Conversión del ID y lectura del cuerpo
			↓
CategoriaRepository
			↓
Consulta SQL sobre categorias
			↓
Respuesta JSON
```

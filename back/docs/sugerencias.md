response

```
# Documentación — Sugerencias

Este módulo registra las interacciones del usuario con los productos y genera
recomendaciones basadas en sus intereses recientes.

## Características

- Registrar una interacción asociada a un producto.
- Asignar un peso según el tipo de evento.
- Inferir la categoría del producto registrado.
- Consultar productos activos recomendados.
- Ordenar las recomendaciones por relevancia y aleatoriedad.
- Retornar los precios disponibles y el precio final con descuento.

## Autenticación

El usuario se obtiene desde:

```ts
(req as any).user || req.session?.user
```

El identificador utilizado por el módulo es:

```ts
user?.id ? String(user.id) : null
```

Si no existe un usuario autenticado, ambos métodos responden con HTTP `401`:

```json
{
    "error": "Usuario no autenticado"
}
```

## Pesos de los eventos

Cada interacción recibe un peso que representa la intensidad del interés del
usuario:

| Tipo de evento | Peso |
|---|---:|
| `vista` | 1 |
| `lista_deseos` | 3 |
| `carrito` | 5 |
| `compra` | 10 |

Los tipos de evento deben escribirse en minúsculas y con `snake_case`. Si el
tipo no está en esta lista, la respuesta es HTTP `400`:

```json
{
    "error": "Tipo de evento inválido"
}
```

## `agregarSugerencia`

Registra una interacción del usuario con un producto en la tabla
`interacciones_usuario`.

### Parámetros de entrada

```json
{
    "producto_id": "7968efcf-a11b-4b8f-b4a4-637dd747a8d1",
    "tipo_evento": "vista"
}
```

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `producto_id` | `string` | Sí | Identificador del producto interactuado. |
| `tipo_evento` | `string` | Sí | Evento que se desea registrar. |

El `usuario_id` se obtiene de la sesión o del middleware de autenticación; no
se recibe desde el cuerpo de la solicitud.

### Validaciones

- El usuario debe estar autenticado.
- `producto_id` es obligatorio.
- `tipo_evento` es obligatorio.
- `tipo_evento` debe ser uno de los eventos permitidos.

Si faltan parámetros, responde con HTTP `400`:

```json
{
    "error": "Faltan parámetros requeridos ('producto_id' y 'tipo_evento')"
}
```

### Proceso

1. Obtiene el usuario autenticado.
2. Valida `producto_id` y `tipo_evento`.
3. Busca el peso correspondiente al tipo de evento.
4. Registra la interacción y obtiene la categoría desde el producto.
5. Retorna una confirmación.

### Consulta utilizada

```sql
INSERT INTO interacciones_usuario
    (usuario_id, producto_id, categoria_id, tipo_evento, peso)
SELECT $1, $2, p.categoria_id, $3, $4
FROM productos p
WHERE p.id = $2;
```

### Orden de parámetros

| Posición | Parámetro | Tipo |
|---:|---|---|
| `$1` | `usuario_id` | `string` |
| `$2` | `producto_id` | `string` |
| `$3` | `tipo_evento` | `string` |
| `$4` | `peso` | `number` |

### Respuesta exitosa

HTTP `201`:

```json
{
    "success": true,
    "message": "Interacción registrada exitosamente"
}
```

## `obtenerSugerencias`

Obtiene productos activos recomendados para el usuario. La consulta analiza
las interacciones de los últimos 30 días y suma sus pesos por categoría.

### Parámetros de consulta

```http
GET /...?limite=10
```

| Parámetro | Tipo | Obligatorio | Valor predeterminado | Descripción |
|---|---|---|---:|---|
| `limite` | `number` | No | `10` | Cantidad máxima de productos a retornar. |

Si `limite` no se envía o no es numérico, se utiliza el valor `10`.

### Proceso de recomendación

1. Obtiene el usuario autenticado.
2. Lee las interacciones de los últimos 30 días.
3. Calcula un puntaje acumulado por categoría.
4. Relaciona ese puntaje con las categorías de cada producto.
5. Filtra únicamente productos con `estado = true`.
6. Incluye los precios disponibles y calcula el precio final aplicando el
     descuento del producto.
7. Ordena primero por relevancia y, en caso de empate, de forma aleatoria.
8. Limita la cantidad de resultados.

### Consulta utilizada

```sql
WITH interes_reciente AS (
    SELECT categoria_id, SUM(peso) AS score_categoria
    FROM interacciones_usuario
    WHERE usuario_id = $1
        AND creado_en >= NOW() - INTERVAL '30 days'
    GROUP BY categoria_id
)
SELECT
    p.id,
    p.nombre,
    p.descripcion,
    p.descuento_porcentaje,
    p.imagen_url,
    p.stock,
    p.estado,
    p.creado_en,
    COALESCE(SUM(ir.score_categoria), 0) AS relevancia,
    COALESCE(
        json_agg(
            json_build_object(
                'id_precio', pr.id_precio,
                'tipo_precio', pr.tipo_precio,
                'precio', pr.precio,
                'precio_final', ROUND(
                    pr.precio * (1 - p.descuento_porcentaje / 100),
                    2
                )
            )
        ) FILTER (WHERE pr.id_precio IS NOT NULL),
        '[]'
    ) AS precios
FROM productos p
LEFT JOIN producto_categorias pc ON pc.producto_id = p.id
LEFT JOIN interes_reciente ir ON ir.categoria_id = pc.categoria_id
LEFT JOIN precios_productos pr ON p.id = pr.id_producto
WHERE p.estado = true
GROUP BY p.id
ORDER BY relevancia DESC, RANDOM()
LIMIT $2;
```

### Orden de parámetros

| Posición | Parámetro | Tipo |
|---:|---|---|
| `$1` | `usuario_id` | `string` |
| `$2` | `limite` | `number` |

### Respuesta exitosa

HTTP `200`:

```json
{
    "success": true,
    "data": [
        {
            "id": "7968efcf-a11b-4b8f-b4a4-637dd747a8d1",
            "nombre": "Molino eléctrico",
            "descripcion": "MOLINO ELÉCTRICO PORTÁTIL MULTIUSOS",
            "descuento_porcentaje": "0.00",
            "imagen_url": "http://localhost:5000/uploads/productos/imagen.jpeg",
            "stock": 10,
            "estado": true,
            "creado_en": "2026-09-08T00:08:34.627Z",
            "relevancia": "0",
            "precios": [
                {
                    "id_precio": "b40ecbdb-d2d7-4272-9030-f87b8c3b72a5",
                    "tipo_precio": "GranMayor",
                    "precio": 8,
                    "precio_final": 8
                }
            ]
        }
    ]
}
```

## Cálculo de relevancia

El puntaje de cada categoría se calcula sumando los pesos de las interacciones
recientes del usuario:

```text
score_categoria = SUM(peso de las interacciones de la categoría)
```

La relevancia de un producto se obtiene al asociar sus categorías con esos
puntajes. Cuando no existe una interacción reciente relacionada, `relevancia`
se devuelve como `0`.

Los productos se ordenan de la siguiente manera:

1. Mayor `relevancia` primero.
2. Orden aleatorio para productos con la misma relevancia.

## Cálculo de precios

Cada elemento de `precios` contiene el precio original y el precio final:

```text
precio_final = ROUND(precio × (1 - descuento_porcentaje / 100), 2)
```

Los precios se agrupan en un arreglo JSON. Si el producto no tiene precios
registrados, el arreglo se devuelve vacío:

```json
"precios": []
```

## Errores

| Código HTTP | Situación | Respuesta |
|---:|---|---|
| `400` | Faltan parámetros al registrar una interacción. | `Faltan parámetros requeridos...` |
| `400` | El tipo de evento no está permitido. | `Tipo de evento inválido` |
| `401` | No existe un usuario autenticado. | `Usuario no autenticado` |
| `500` | Ocurre un error inesperado en el servidor. | `Error interno del servidor` |

Los errores internos incluyen también la propiedad `details` con el mensaje
del error capturado por el controlador.

## Resumen

| Método del controlador | Propósito | Estado exitoso |
|---|---|---:|
| `agregarSugerencia` | Registrar una interacción del usuario. | `201` |
| `obtenerSugerencias` | Obtener productos recomendados. | `200` |
```

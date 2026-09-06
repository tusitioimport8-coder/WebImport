# 🛒 Documentación — Carrito

Este módulo administra el carrito activo del usuario.

Además de almacenar productos y cantidades, el carrito aplica automáticamente un **nivel de precio** según el total de unidades y el monto base calculado con precios `Detal`.

## Características

- Obtener el carrito procesado.
- Agregar o incrementar productos.
- Actualizar cantidades.
- Eliminar productos individuales.
- Vaciar el carrito.
- Aplicar automáticamente precios `Detal`, `Mayor` o `GranMayor`.
- Aplicar descuentos por producto.
- Calcular subtotales y total final.
- Generar notificaciones de progreso hacia el siguiente nivel.

---

# Sistema de precios

## `TipoPrecio`

```ts
export type TipoPrecio = "Detal" | "Mayor" | "GranMayor";
```

El carrito trabaja con tres niveles:

| Nivel | Condición |
|---|---|
| `Detal` | Nivel predeterminado |
| `Mayor` | Al menos 6 unidades y monto base de al menos 50 |
| `GranMayor` | Al menos 40 unidades y monto base de al menos 200 |

> El monto utilizado para determinar el nivel se calcula usando `precio_detal`.

## Reglas

```text
Si unidades >= 40 y monto base >= 200
    → GranMayor

Si no, pero unidades >= 6 y monto base >= 50
    → Mayor

En cualquier otro caso
    → Detal
```

---

# Interfaces

## `CarritoItemBase`

Representa información base de un ítem.

```ts
export interface CarritoItemBase {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_detal: number;
}
```

## `NotificacionProgreso`

Representa el progreso del carrito hacia el siguiente nivel.

```ts
export interface NotificacionProgreso {
  mensaje: string;
  nivel_actual: TipoPrecio;
  siguiente_nivel: TipoPrecio | null;
  progreso_porcentaje: number;
  faltante_unidades: number;
  faltante_monto: number;
}
```

## `ResultadoRecalculoCarrito`

Representa información general obtenida durante un recálculo.

```ts
export interface ResultadoRecalculoCarrito {
  carrito_id: string;
  nivel_actual: TipoPrecio;
  total_unidades: number;
  monto_base_detal: number;
  notificacion: NotificacionProgreso;
}
```

## `CarritoItemRaw`

Representa la fila cruda obtenida desde:

```text
obtenerProductosCarritoRaw
```

```ts
export interface CarritoItemRaw {
  item_id: string;
  producto_id: string;
  nombre: string;
  imagen_url: string;
  descuento_porcentaje: number;
  cantidad: number;
  precio_detal: number;
  precio_mayor: number;
  precio_gran_mayor: number;
}
```

## `CarritoItemFormateado`

Representa el producto procesado que recibe el frontend.

```ts
export interface CarritoItemFormateado {
  item_id: string;
  producto_id: string;
  nombre: string;
  imagen_url: string;
  cantidad: number;
  tipo_precio_aplicado: TipoPrecio;
  precio_unitario: number;
  descuento_porcentaje: number;
  precio_final: number;
  subtotal: number;
}
```

## `CarritoResumen`

```ts
export interface CarritoResumen {
  nivel_aplicado: TipoPrecio;
  total_unidades: number;
  total_pagar: number;
}
```

## `CarritoResponseData`

Representa la respuesta procesada del carrito.

```ts
export interface CarritoResponseData {
  carrito_id: string;
  resumen: CarritoResumen;
  notificacion: NotificacionProgreso;
  items: CarritoItemFormateado[];
}
```

## Inputs

### `CarritoItemInput`

```ts
export interface CarritoItemInput {
  carrito_id: string;
  producto_id: string;
  cantidad: number;
}
```

### `CarritoItemUpdateInput`

```ts
export interface CarritoItemUpdateInput {
  carrito_id: string;
  producto_id: string;
  cantidad: number;
}
```

---

# Autenticación

El usuario se obtiene desde:

```ts
(req as any).user || req.session?.user;
```

El ID utilizado por el módulo es:

```ts
user?.id ? String(user.id) : null;
```

Si no existe un usuario autenticado, los endpoints responden con:

```json
{
  "error": "Usuario no autenticado"
}
```

---

# Endpoints

## `GET /api/carrito`

Retorna el detalle procesado del carrito activo.

### Proceso

1. Obtiene el usuario autenticado.
2. Obtiene o crea el carrito activo.
3. Obtiene los productos crudos.
4. Calcula unidades y monto base.
5. Determina el nivel de precio.
6. Aplica precios y descuentos.
7. Calcula la notificación.
8. Retorna el carrito completo.

### Respuesta

```json
{
  "success": true,
  "data": {
    "carrito_id": "1",
    "resumen": {
      "nivel_aplicado": "Mayor",
      "total_unidades": 8,
      "total_pagar": 120
    },
    "notificacion": {
      "mensaje": "Estás en nivel Mayor...",
      "nivel_actual": "Mayor",
      "siguiente_nivel": "GranMayor",
      "progreso_porcentaje": 50,
      "faltante_unidades": 32,
      "faltante_monto": 80
    },
    "items": []
  }
}
```

---

## `POST /api/carrito`

Agrega un producto o incrementa su cantidad.

### Request Body

```json
{
  "producto_id": "1",
  "cantidad": 2
}
```

### Validación

- `producto_id` es obligatorio.
- `cantidad` es obligatoria.
- `cantidad` debe ser mayor que `0`.

Error:

```json
{
  "error": "Parámetros 'producto_id' y 'cantidad' (mayor a 0) son obligatorios"
}
```

### Proceso

1. Obtiene el usuario.
2. Valida los parámetros.
3. Obtiene o crea el carrito.
4. Ejecuta `agregarOIncrementarItem()`.
5. Procesa nuevamente el carrito.
6. Retorna el estado actualizado.

### Respuesta

```json
{
  "success": true,
  "message": "Producto agregado al carrito exitosamente",
  "data": {}
}
```

---

## `PUT /api/carrito/:productoId`

Establece la cantidad exacta de un producto.

### Parámetro

| Parámetro | Descripción |
|---|---|
| `productoId` | ID del producto |

### Request Body

```json
{
  "cantidad": 5
}
```

### Regla especial

Si:

```text
cantidad = 0
```

el producto se elimina automáticamente del carrito.

### Proceso

```text
cantidad > 0
    → actualizarCantidadItem()

cantidad = 0
    → eliminarItem()
```

### Respuesta

```json
{
  "success": true,
  "message": "Cantidad actualizada exitosamente",
  "data": {}
}
```

---

## `DELETE /api/carrito/:productoId`

Elimina un producto específico.

### Ejemplo

```http
DELETE /api/carrito/123
```

### Proceso

1. Obtiene el usuario.
2. Obtiene o crea el carrito.
3. Ejecuta `eliminarItem()`.
4. Procesa nuevamente el carrito.
5. Retorna el estado actualizado.

### Respuesta

```json
{
  "success": true,
  "message": "Producto eliminado del carrito",
  "data": {}
}
```

---

## `DELETE /api/carrito`

Elimina todos los productos del carrito activo.

### Proceso

1. Obtiene el usuario.
2. Obtiene o crea el carrito.
3. Ejecuta `vaciarCarrito()`.
4. Procesa nuevamente el carrito.
5. Retorna el carrito vacío.

### Respuesta

```json
{
  "success": true,
  "message": "Carrito vaciado exitosamente",
  "data": {}
}
```

---

# Procesamiento interno

El método encargado de construir la respuesta final sigue este flujo:

```text
Usuario
   ↓
Obtener o crear carrito
   ↓
Obtener productos crudos
   ↓
Calcular total de unidades
   ↓
Calcular monto base Detal
   ↓
Determinar nivel
   ├── Detal
   ├── Mayor
   └── GranMayor
   ↓
Aplicar precio correspondiente
   ↓
Aplicar descuento
   ↓
Calcular subtotal
   ↓
Calcular total
   ↓
Generar notificación
   ↓
Retornar respuesta para frontend
```

## 1. Total de unidades

Se suman las cantidades de todos los productos.

## 2. Monto base Detal

Se calcula utilizando:

```text
cantidad × precio_detal
```

Este valor se utiliza para determinar el nivel.

## 3. Aplicación del precio

Dependiendo del nivel:

```text
Detal       → precio_detal
Mayor       → precio_mayor
GranMayor   → precio_gran_mayor
```

## 4. Aplicación del descuento

Para cada producto:

```text
precio_final = precio_unitario × (1 - descuento / 100)
```

## 5. Subtotal

```text
subtotal = precio_final × cantidad
```

## 6. Total

El total del carrito es la suma de todos los subtotales.

---

# Notificaciones de progreso

El sistema informa al usuario sobre su progreso hacia el siguiente nivel.

## Cuando está en `Detal`

La siguiente meta es `Mayor`.

Meta:

```text
6 unidades
y
50 de monto base
```

## Cuando está en `Mayor`

La siguiente meta es `GranMayor`.

Meta:

```text
40 unidades
y
200 de monto base
```

## Cuando está en `GranMayor`

El usuario ya alcanzó el nivel máximo.

```json
{
  "nivel_actual": "GranMayor",
  "siguiente_nivel": null,
  "progreso_porcentaje": 100,
  "faltante_unidades": 0,
  "faltante_monto": 0
}
```

---

# Cálculo del progreso

El progreso combina dos porcentajes:

1. Progreso por unidades.
2. Progreso por monto.

Después se calcula el promedio:

```text
(progresoUnidades + progresoMonto) / 2
```

El resultado se redondea a un decimal.

---

# Resumen de endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/carrito` | Obtener carrito |
| `POST` | `/api/carrito` | Agregar o incrementar producto |
| `PUT` | `/api/carrito/:productoId` | Actualizar cantidad |
| `DELETE` | `/api/carrito/:productoId` | Eliminar producto |
| `DELETE` | `/api/carrito` | Vaciar carrito |

---

# Resumen del flujo de negocio

```text
El usuario agrega productos
        ↓
El sistema calcula unidades
        ↓
El sistema calcula monto base Detal
        ↓
Determina el nivel aplicable
        ↓
Aplica la tarifa correspondiente
        ↓
Aplica descuentos individuales
        ↓
Calcula subtotales y total
        ↓
Calcula progreso hacia el siguiente nivel
        ↓
El frontend recibe el carrito completamente procesado
```

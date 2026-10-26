# Documentación de API: Gestión de pedidos

## 1. Descripción general

El módulo de pedidos permite registrar compras de clientes invitados o usuarios autenticados, consultar pedidos registrados, obtener el detalle de un pedido y actualizar su estado.

El sistema valida los productos con la información almacenada en la base de datos, calcula el nivel de precio aplicable según la cantidad total de unidades y el monto base de la compra, aplica los descuentos correspondientes y registra el pedido con sus respectivos detalles.

Después de crear un pedido, genera un enlace de WhatsApp con la información de la compra para facilitar la comunicación con la empresa.

### Funcionalidades principales

- Crear pedidos como invitado o usuario autenticado.
- Validar la existencia de los productos.
- Calcular precios por volumen de compra.
- Aplicar descuentos por producto.
- Registrar el pedido y sus detalles.
- Generar un enlace de WhatsApp para confirmar o comunicar la compra.
- Consultar todos los pedidos.
- Consultar un pedido específico con sus productos.
- Actualizar el estado de un pedido.

## 2. Endpoints disponibles

| Método | Endpoint                  | Descripción                             |
| ------ | ------------------------- | --------------------------------------- |
| POST   | `/api/pedidos`            | Crear un pedido.                        |
| GET    | `/api/pedidos`            | Listar todos los pedidos.               |
| GET    | `/api/pedidos/:id`        | Obtener un pedido por su identificador. |
| PATCH  | `/api/pedidos/:id/estado` | Actualizar el estado de un pedido.      |

**Formato de intercambio:** JSON.

**Cabecera requerida para solicitudes con cuerpo JSON:**

`Content-Type: application/json`

Las rutas anteriores corresponden a las URL documentadas en el controlador. El prefijo `/api` debe coincidir con el montaje real del router en Express.

---

## 3. Crear un pedido

### `POST /api/pedidos`

**Descripción:** Registra un nuevo pedido con los datos de contacto del cliente, la modalidad de entrega, el método de pago y los productos seleccionados.

El endpoint permite procesar pedidos tanto de usuarios autenticados como de invitados.

### Cuerpo de la solicitud

```json
{
  "contacto": {
    "nombre_completo": "Juan Pérez",
    "telefono": "04121234567",
    "correo": "juan@ejemplo.com",
    "sede": "Caracas",
    "direccion_base": "Av. Principal, local 12"
  },
  "entrega": {
    "tipo": "domicilio",
    "detalles": "Casa blanca, portón negro"
  },
  "pago": {
    "metodo": "transferencia"
  },
  "items": [
    {
      "producto_id": "producto-123",
      "cantidad": 6
    },
    {
      "producto_id": "producto-456",
      "cantidad": 4
    }
  ]
}
```

### Parámetros de la solicitud

#### Objeto `contacto`

| Campo             | Tipo     | Descripción                              |
| ----------------- | -------- | ---------------------------------------- |
| `nombre_completo` | `string` | Nombre completo del cliente.             |
| `telefono`        | `string` | Número telefónico de contacto.           |
| `correo`          | `string` | Correo electrónico del cliente.          |
| `sede`            | `string` | Sede relacionada con el pedido.          |
| `direccion_base`  | `string` | Dirección base del cliente o del pedido. |

#### Objeto `entrega`

| Campo      | Tipo     | Descripción                                      |
| ---------- | -------- | ------------------------------------------------ |
| `tipo`     | `string` | Tipo de entrega solicitado.                      |
| `detalles` | `string` | Información adicional para gestionar la entrega. |

#### Objeto `pago`

| Campo    | Tipo     | Descripción                                 |
| -------- | -------- | ------------------------------------------- |
| `metodo` | `string` | Método de pago seleccionado por el cliente. |

#### Arreglo `items`

| Campo         | Tipo     | Descripción                                     |
| ------------- | -------- | ----------------------------------------------- |
| `producto_id` | `string` | Identificador del producto en la base de datos. |
| `cantidad`    | `number` | Cantidad de unidades solicitadas.               |

El arreglo `items` puede contener varios productos. Cada elemento representa un producto y la cantidad solicitada.

### Proceso de creación

1. **Validación del carrito:** verifica que el arreglo `items` exista y contenga elementos.
2. **Validación de datos generales:** comprueba que estén presentes los objetos `contacto`, `entrega` y `pago`.
3. **Validación de productos:** consulta la base de datos para verificar que cada producto exista y obtener sus precios.
4. **Cálculo del nivel de precio:** suma las unidades y calcula el monto base utilizando los precios al detal.
5. **Aplicación de descuentos:** determina el precio unitario aplicable a cada producto y aplica el descuento porcentual correspondiente.
6. **Construcción de detalles:** calcula el subtotal de cada producto y el total del pedido.
7. **Identificación del cliente:** utiliza el identificador de la sesión si existe; en caso contrario, registra el pedido como invitado con `id_usuario: null`.
8. **Registro del pedido:** guarda los datos generales del pedido y sus detalles mediante el repositorio.
9. **Generación del enlace de WhatsApp:** construye un enlace con los datos de la orden, los productos, el nivel de precio aplicado y el total a pagar.
10. **Respuesta al frontend:** devuelve los datos del pedido creado y el enlace generado.

### Reglas de precios por volumen

El sistema calcula el nivel de precio utilizando el número total de unidades y el monto base de la compra. Las condiciones se evalúan en el siguiente orden:

| Nivel     |                     Unidades totales | Monto base mínimo |
| --------- | -----------------------------------: | ----------------: |
| GranMayor |                             40 o más |               200 |
| Mayor     |                              6 o más |                50 |
| Detal     | No cumple las condiciones anteriores |         No aplica |

Para acceder al nivel **GranMayor**, deben cumplirse simultáneamente las dos condiciones. Lo mismo ocurre con el nivel **Mayor**.

Si el pedido cumple los requisitos de GranMayor, ese nivel tiene prioridad sobre Mayor.

Los montos de referencia corresponden a la suma de los precios al detal por las cantidades solicitadas, antes de aplicar los descuentos porcentuales.

### Cálculo de precios

Para cada producto se aplica el precio correspondiente al nivel de compra:

- `Detal`: utiliza `precio_detal`.
- `Mayor`: utiliza `precio_mayor`.
- `GranMayor`: utiliza `precio_gran_mayor`.

Después se aplica el descuento porcentual del producto.

La fórmula utilizada es:

**Precio final unitario:**

`precioUnitario × (1 - descuento / 100)`

**Subtotal del producto:**

`precioFinal × cantidad`

**Total del pedido:**

Suma de los subtotales de todos los productos.

Los precios finales unitarios y subtotales se redondean a dos decimales. El total se devuelve igualmente con dos decimales.

### Respuesta exitosa

**Código HTTP:** `201 Created`

```json
{
  "success": true,
  "message": "¡Pedido registrado exitosamente!",
  "data": {
    "pedido": {
      "id": "pedido-123",
      "creado_en": "2026-10-19T20:30:00.000Z"
    },
    "whatsappUrl": "https://wa.me/..."
  }
}
```

La estructura de `data.pedido` depende del resultado devuelto por el repositorio. El ejemplo muestra únicamente los campos que devuelve la operación de creación, no una respuesta real del servidor.

| Campo              | Tipo      | Descripción                                                         |
| ------------------ | --------- | ------------------------------------------------------------------- |
| `success`          | `boolean` | Indica si la operación fue exitosa.                                 |
| `message`          | `string`  | Mensaje de confirmación.                                            |
| `data.pedido`      | `object`  | Datos del pedido creado.                                            |
| `data.whatsappUrl` | `string`  | Enlace generado para abrir WhatsApp con la información de la orden. |

### Respuestas de error

**400 Bad Request — Carrito vacío**

```json
{
  "success": false,
  "message": "El carrito está vacío"
}
```

Se devuelve cuando `items` no existe o no contiene productos.

**400 Bad Request — Datos obligatorios faltantes**

```json
{
  "success": false,
  "message": "Faltan datos obligatorios del pedido"
}
```

Se devuelve cuando falta alguno de los objetos `contacto`, `entrega` o `pago`.

**404 Not Found — Producto inexistente**

```json
{
  "success": false,
  "message": "Producto producto-123 no encontrado"
}
```

Se devuelve cuando alguno de los productos solicitados no existe en la base de datos. El identificador incluido en el mensaje corresponde al producto que no pudo encontrarse.

**500 Internal Server Error — Error al crear el pedido**

```json
{
  "success": false,
  "message": "Error interno al procesar el pedido",
  "details": "Descripción del error"
}
```

Se devuelve cuando ocurre un error inesperado durante el procesamiento.

El campo `details` contiene `error.message` según el código actual y puede incluir información técnica. Se recomienda no exponerlo en producción.

---

## 4. Listar todos los pedidos

### `GET /api/pedidos`

**Descripción:** Obtiene la lista de pedidos registrados en el sistema. Está pensado principalmente para la gestión administrativa.

### Parámetros

No requiere parámetros de ruta ni cuerpo de solicitud.

### Proceso

1. Solicita al repositorio todos los pedidos registrados.
2. Recupera los resultados ordenados por fecha de creación, del más reciente al más antiguo.
3. Devuelve la lista dentro de la propiedad `data`.

### Respuesta exitosa

**Código HTTP:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "pedido-123",
      "nombre_completo": "Juan Pérez",
      "telefono": "04121234567",
      "correo": "juan@ejemplo.com",
      "sede": "Caracas",
      "tipo_entrega": "domicilio",
      "metodo_pago": "transferencia",
      "total": 125.5,
      "estado": "pendiente",
      "creado_en": "2026-10-19T20:30:00.000Z"
    }
  ]
}
```

Los valores son ilustrativos y pueden variar según los datos almacenados y los tipos devueltos por el controlador de base de datos.

### Estructura de cada pedido

| Campo             | Tipo esperado | Descripción                     |
| ----------------- | ------------- | ------------------------------- |
| `id`              | `string`      | Identificador del pedido.       |
| `nombre_completo` | `string`      | Nombre del cliente.             |
| `telefono`        | `string`      | Teléfono de contacto.           |
| `correo`          | `string`      | Correo electrónico del cliente. |
| `sede`            | `string`      | Sede asociada al pedido.        |
| `tipo_entrega`    | `string`      | Modalidad de entrega.           |
| `metodo_pago`     | `string`      | Método de pago seleccionado.    |
| `total`           | `number`      | Importe total del pedido.       |
| `estado`          | `string`      | Estado actual del pedido.       |
| `creado_en`       | `string`      | Fecha de creación del pedido.   |

### Respuesta de error

**500 Internal Server Error**

```json
{
  "success": false,
  "message": "Error al obtener los pedidos",
  "details": "Descripción del error"
}
```

Se devuelve cuando ocurre un error al consultar los pedidos.

---

## 5. Obtener un pedido por identificador

### `GET /api/pedidos/:id`

**Descripción:** Obtiene la información de un pedido específico, incluidos sus datos generales y los productos asociados.

### Parámetros de ruta

| Parámetro | Tipo     | Obligatorio | Descripción                                      |
| --------- | -------- | ----------- | ------------------------------------------------ |
| `id`      | `string` | Sí          | Identificador del pedido que se desea consultar. |

### Ejemplo de solicitud

`GET /api/pedidos/pedido-123`

No requiere cuerpo de solicitud.

### Proceso

1. Obtiene el identificador desde los parámetros de la URL.
2. Consulta el pedido en el repositorio.
3. Recupera los datos generales del pedido y sus productos asociados.
4. Si el pedido no existe, devuelve un error 404.
5. Si existe, devuelve los datos completos en la propiedad `data`.

### Respuesta exitosa

**Código HTTP:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "pedido-123",
    "nombre_completo": "Juan Pérez",
    "telefono": "04121234567",
    "correo": "juan@ejemplo.com",
    "sede": "Caracas",
    "direccion_base": "Av. Principal, local 12",
    "tipo_entrega": "domicilio",
    "datos_entrega": "Casa blanca, portón negro",
    "metodo_pago": "transferencia",
    "total": 125.5,
    "estado": "pendiente",
    "creado_en": "2026-10-19T20:30:00.000Z",
    "items": [
      {
        "id_producto": "producto-123",
        "cantidad": 2,
        "precio_unitario": 50.0,
        "subtotal": 100.0
      },
      {
        "id_producto": "producto-456",
        "cantidad": 1,
        "precio_unitario": 25.5,
        "subtotal": 25.5
      }
    ]
  }
}
```

Los datos son ilustrativos. La respuesta real depende de los valores almacenados en la base de datos.

### Estructura de la respuesta

#### Datos generales

| Campo             | Tipo esperado | Descripción                            |
| ----------------- | ------------- | -------------------------------------- |
| `id`              | `string`      | Identificador del pedido.              |
| `nombre_completo` | `string`      | Nombre del cliente.                    |
| `telefono`        | `string`      | Teléfono de contacto.                  |
| `correo`          | `string`      | Correo del cliente.                    |
| `sede`            | `string`      | Sede relacionada con el pedido.        |
| `direccion_base`  | `string`      | Dirección base registrada.             |
| `tipo_entrega`    | `string`      | Modalidad de entrega.                  |
| `datos_entrega`   | `string`      | Información adicional para la entrega. |
| `metodo_pago`     | `string`      | Método de pago.                        |
| `total`           | `number`      | Importe total del pedido.              |
| `estado`          | `string`      | Estado actual del pedido.              |
| `creado_en`       | `string`      | Fecha de creación.                     |

#### Productos del pedido: `items`

| Campo             | Tipo esperado | Descripción                                                      |
| ----------------- | ------------- | ---------------------------------------------------------------- |
| `id_producto`     | `string`      | Identificador del producto.                                      |
| `cantidad`        | `number`      | Unidades compradas.                                              |
| `precio_unitario` | `number`      | Precio unitario aplicado al pedido.                              |
| `subtotal`        | `number`      | Subtotal calculado a partir de la cantidad y el precio unitario. |

Si el pedido no tiene detalles asociados, la consulta del repositorio está preparada para devolver un arreglo `items` vacío.

### Respuestas de error

**404 Not Found — Pedido inexistente**

```json
{
  "success": false,
  "message": "Pedido no encontrado"
}
```

**500 Internal Server Error — Error al consultar el pedido**

```json
{
  "success": false,
  "message": "Error al obtener el detalle del pedido",
  "details": "Descripción del error"
}
```

---

## 6. Actualizar el estado de un pedido

### `PATCH /api/pedidos/:id/estado`

**Descripción:** Actualiza el estado o fase de un pedido existente. Esta operación permite reflejar los cambios en el procesamiento de una compra.

### Parámetros de ruta

| Parámetro | Tipo     | Obligatorio | Descripción                                       |
| --------- | -------- | ----------- | ------------------------------------------------- |
| `id`      | `string` | Sí          | Identificador del pedido que se desea actualizar. |

### Cuerpo de la solicitud

```json
{
  "estado": "confirmado"
}
```

| Campo    | Tipo     | Obligatorio | Descripción                             |
| -------- | -------- | ----------- | --------------------------------------- |
| `estado` | `string` | Sí          | Nuevo estado que se asignará al pedido. |

El controlador comprueba que `estado` tenga un valor. Los estados permitidos no están restringidos explícitamente en este método, por lo que deben documentarse según las reglas de negocio definidas en el resto de la aplicación.

### Proceso

1. Obtiene el identificador del pedido desde la URL.
2. Extrae el nuevo estado del cuerpo de la solicitud.
3. Comprueba que el campo `estado` esté presente.
4. Solicita al repositorio la actualización del estado y la fecha de actualización.
5. Si el pedido no existe, devuelve un error 404.
6. Si la actualización se realiza correctamente, devuelve el pedido actualizado.

### Respuesta exitosa

**Código HTTP:** `200 OK`

```json
{
  "success": true,
  "message": "Estado del pedido actualizado correctamente",
  "data": {
    "id": "pedido-123",
    "estado": "confirmado"
  }
}
```

El objeto `data` contiene el registro devuelto por el repositorio. El ejemplo muestra únicamente algunos de sus campos.

### Respuestas de error

**400 Bad Request — Estado requerido**

```json
{
  "success": false,
  "message": "El campo 'estado' es requerido"
}
```

**404 Not Found — Pedido no encontrado**

```json
{
  "success": false,
  "message": "Pedido no encontrado para actualizar"
}
```

**500 Internal Server Error — Error al actualizar el estado**

```json
{
  "success": false,
  "message": "Error al actualizar el estado del pedido",
  "details": "Descripción del error"
}
```

---

## 7. Integración con WhatsApp

Durante la creación de un pedido, el backend genera un enlace de WhatsApp mediante `generarLinkWhatsAppHelper`.

El enlace incluye información necesaria para comunicar la orden a la empresa, como:

- Identificador del pedido.
- Nombre del cliente.
- Teléfono del cliente.
- Tipo de entrega.
- Método de pago.
- Nivel de precio aplicado.
- Productos, cantidades y subtotales.
- Total a pagar.

El número de WhatsApp de la empresa se obtiene de la variable de entorno `WHATSAPP_EMPRESA`. Si esta variable no está definida, el código utiliza un número predeterminado.

El enlace se devuelve en `data.whatsappUrl`, para que el frontend pueda abrirlo o redirigir al usuario.

**Importante:** generar el enlace no significa que el mensaje se haya enviado automáticamente ni que el pago haya sido confirmado. La apertura y el envío del mensaje dependen de la interacción del usuario con WhatsApp.

---

## 8. Autenticación y permisos

El endpoint de creación contempla dos escenarios:

- **Usuario autenticado:** se utiliza el identificador del usuario almacenado en la sesión.
- **Usuario invitado:** se asigna `null` a `id_usuario`.

Los demás endpoints no muestran verificaciones de sesión, roles o permisos dentro del controlador proporcionado.

Como el listado de pedidos, la consulta de pedidos individuales y la actualización de estados pueden exponer información de clientes o permitir modificaciones administrativas, deben protegerse mediante middleware de autenticación y autorización según corresponda.

La autorización efectiva depende de los middlewares y de la configuración de rutas de la aplicación.

---

## 9. Consideraciones técnicas y de negocio

### Validación de datos

El controlador comprueba que el carrito no esté vacío y que existan los objetos principales del pedido. Sin embargo, en el código mostrado no se validan explícitamente:

- Que cada cantidad sea un número entero positivo.
- Que cada `producto_id` tenga el formato esperado.
- Que los campos de contacto tengan formatos válidos.
- Que el método de pago y el tipo de entrega pertenezcan a valores permitidos.
- Que el estado solicitado esté dentro de una lista autorizada.

Estas validaciones deberían implementarse en el backend antes de registrar o modificar información.

### Consistencia de precios

Los precios se obtienen de la base de datos, evitando depender de los importes enviados por el frontend. Esto permite calcular el total a partir de la información disponible en el servidor.

La operación de guardar el pedido y sus detalles debería ejecutarse dentro de una transacción para evitar pedidos incompletos si falla la inserción de alguno de sus productos.

### Gestión de errores

Los endpoints devuelven respuestas JSON con el campo `success` y un mensaje descriptivo. En los errores internos también se incluye `details`, que actualmente contiene el mensaje de la excepción.

En producción, es recomendable registrar los detalles técnicos en el servidor y devolver mensajes genéricos al cliente para evitar exponer información interna.

### Protección de datos

Los pedidos incluyen datos personales como nombre, correo, teléfono y dirección. El acceso a esta información debe limitarse a los usuarios y roles autorizados.

---

## 10. Resumen del flujo de pedidos

1. El cliente selecciona productos y cantidades en el frontend.
2. El frontend envía los datos de contacto, entrega, pago y carrito a `POST /api/pedidos`.
3. El backend valida los productos y calcula los precios aplicables.
4. El pedido y sus detalles se guardan en la base de datos.
5. Se genera el enlace de WhatsApp y se devuelve al frontend.
6. Los administradores pueden consultar los pedidos mediante `GET /api/pedidos`.
7. Se puede consultar un pedido específico con `GET /api/pedidos/:id`.
8. El estado del pedido puede modificarse mediante `PATCH /api/pedidos/:id/estado`.

Con estos endpoints se cubren las operaciones principales de registro, consulta y actualización de pedidos del sistema.

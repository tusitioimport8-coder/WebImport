# TuSitioImport

# Documentación — Auth

## Import

```ts
import Auth from "./Auth.js";
```

---

# Endpoints de autenticación

## `POST /login`

Permite autenticar a un usuario utilizando su correo electrónico y contraseña.

### Request Body

Acepta las siguientes propiedades:

| Campo        | Tipo     | Obligatorio | Descripción                     |
| ------------ | -------- | ----------- | ------------------------------- |
| `correo`     | `string` | Sí\*        | Correo electrónico del usuario. |
| `email`      | `string` | Sí\*        | Alias de `correo`.              |
| `password`   | `string` | Sí\*        | Contraseña del usuario.         |
| `contrasena` | `string` | Sí\*        | Alias de `password`.            |

- Se debe proporcionar `correo` **o** `email`, y `password` **o** `contrasena`.

### Ejemplo

```json
{
  "correo": "usuario@email.com",
  "password": "MiPassword123"
}
```

También es válido:

```json
{
  "email": "usuario@email.com",
  "contrasena": "MiPassword123"
}
```

### Proceso

1. Obtiene el correo y la contraseña enviados.
2. Normaliza el correo eliminando espacios.
3. Valida que el correo tenga un formato válido.
4. Busca el usuario en la base de datos mediante su correo.
5. Compara la contraseña recibida con el hash almacenado utilizando `Bcrypt`.
6. Construye la información del usuario para la sesión.
7. Crea la sesión mediante `Session.createSession()`.

### Respuesta exitosa

La creación de la sesión se realiza mediante `Session.ts`. El método retorna la respuesta generada por el sistema de sesiones.

### Errores

#### `400 Bad Request`

Cuando no se proporciona correo o contraseña:

```json
{
  "success": false,
  "message": "Correo y contraseña son requeridos"
}
```

Cuando el correo no es válido:

```json
{
  "success": false,
  "message": "Correo electrónico inválido"
}
```

#### `401 Unauthorized`

Cuando el usuario no existe:

```json
{
  "success": false,
  "message": "Usuario no encontrado"
}
```

Cuando la contraseña es incorrecta:

```json
{
  "success": false,
  "message": "Contraseña incorrecta"
}
```

#### `500 Internal Server Error`

Cuando ocurre un error inesperado:

```json
{
  "success": false,
  "message": "Error interno en el servidor durante el inicio de sesión"
}
```

---

# `POST /register`

Permite registrar un nuevo usuario en el sistema.

### Request Body

| Campo             | Tipo     | Obligatorio | Descripción                                |
| ----------------- | -------- | ----------- | ------------------------------------------ |
| `nombre_completo` | `string` | Sí          | Nombre completo del usuario.               |
| `correo`          | `string` | Sí          | Correo electrónico.                        |
| `password`        | `string` | Sí\*        | Contraseña del usuario.                    |
| `contrasena`      | `string` | Sí\*        | Alias de `password`.                       |
| `telefono`        | `string` | No          | Número telefónico del usuario.             |
| `rol`             | `string` | No          | Rol del usuario. Por defecto es `cliente`. |

- Se debe proporcionar `password` o `contrasena`.

### Ejemplo

```json
{
  "nombre_completo": "Juan Pérez",
  "correo": "juan@email.com",
  "password": "MiPassword123",
  "telefono": "5551234567",
  "rol": "cliente"
}
```

### Proceso

1. Obtiene los datos enviados en el body.
2. Normaliza el correo eliminando espacios.
3. Verifica que los campos obligatorios estén presentes.
4. Valida el formato del correo.
5. Valida la seguridad de la contraseña.
6. Comprueba que el correo no esté registrado previamente.
7. Encripta la contraseña utilizando `Bcrypt`.
8. Construye el objeto `CrearUsuarioDTO`.
9. Guarda el usuario mediante `repository.crearUsuario()`.
10. Retorna el ID del usuario creado.

### Rol predeterminado

Si no se especifica un rol:

```ts
rol: "cliente";
```

Por ejemplo:

```json
{
  "nombre_completo": "Juan Pérez",
  "correo": "juan@email.com",
  "password": "MiPassword123"
}
```

se registra automáticamente como:

```text
cliente
```

### Respuesta exitosa — `201 Created`

```json
{
  "success": true,
  "message": "Usuario creado correctamente",
  "id_usuario": "123"
}
```

### Errores

#### `400 Bad Request`

Cuando faltan campos obligatorios:

```json
{
  "success": false,
  "message": "Los campos nombre_completo, correo y contraseña son obligatorios"
}
```

Cuando el correo es inválido:

```json
{
  "success": false,
  "message": "Correo electrónico inválido"
}
```

Cuando la contraseña no cumple los requisitos:

```json
{
  "success": false,
  "message": "La contraseña no cumple con los requisitos mínimos de seguridad"
}
```

#### `409 Conflict`

Cuando el correo ya está registrado:

```json
{
  "success": false,
  "message": "El correo electrónico ya está registrado"
}
```

#### `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Ocurrió un error al registrar el usuario"
}
```

---

# `POST /logout`

Permite cerrar la sesión del usuario autenticado.

### Request Body

No requiere información en el body.

La sesión se obtiene directamente desde la petición:

```ts
req.session;
```

### Proceso

1. Recibe la petición.
2. Delega la destrucción de la sesión a `Session.destroySession()`.
3. Finaliza la sesión actual.

### Ejemplo

```http
POST /logout
```

### Respuesta

El método retorna la respuesta generada por `Session.destroySession()`.

---

# Métodos adicionales de `Auth`

Además de los endpoints de autenticación, la clase `Auth` contiene métodos para administrar usuarios y sesiones.

---

## `resolveUserId()`

Obtiene el ID del usuario desde diferentes ubicaciones de la petición.

Busca el ID en el siguiente orden:

1. Sesión:

   ```ts
   req.session?.user?.id;
   ```

2. Body:

   ```ts
   req.body?.id_usuario;
   ```

3. Body alternativo:

   ```ts
   req.body?.usuarioId;
   ```

4. Query:

   ```ts
   req.query?.usuarioId;
   ```

5. Params:

   ```ts
   req.params?.usuarioId;
   ```

Si encuentra un ID, lo convierte a `string`.

Si no encuentra ninguno, retorna:

```ts
null;
```

---

# `deleteUser()`

Elimina un usuario del sistema.

### Obtención del ID

Utiliza:

```ts
resolveUserId();
```

Por lo tanto, el ID puede recibirse mediante sesión, body, query o params.

### Proceso

1. Obtiene el ID del usuario.
2. Verifica que exista.
3. Elimina el usuario mediante:

   ```ts
   repository.eliminarUsuario(usuarioId);
   ```

4. Si existe una sesión activa, la destruye.
5. Retorna una respuesta de confirmación.

### Respuesta exitosa

```json
{
  "success": true,
  "message": "La cuenta de usuario ha sido eliminada exitosamente"
}
```

### Error

```json
{
  "success": false,
  "message": "ID de usuario inválido o ausente"
}
```

---

# `updateUser()`

Permite actualizar la información de un usuario.

### Campos recibidos

| Campo             | Tipo     | Obligatorio | Descripción               |
| ----------------- | -------- | ----------- | ------------------------- |
| `nombre_completo` | `string` | No          | Nuevo nombre del usuario. |
| `correo`          | `string` | No          | Nuevo correo electrónico. |
| `telefono`        | `string` | No          | Nuevo teléfono.           |
| `newPassword`     | `string` | No          | Nueva contraseña.         |

Debe proporcionarse al menos uno de estos campos.

### Ejemplo

```json
{
  "nombre_completo": "Juan Pérez García",
  "telefono": "5559876543"
}
```

### Cambio de contraseña

Si se proporciona `newPassword`, primero se valida y posteriormente se encripta:

```ts
const hashed = await this.bcrypt.hash(newPassword);
```

Después se actualiza mediante:

```ts
repository.actualizarPassword(usuarioId, hashed);
```

### Respuesta exitosa

```json
{
  "success": true,
  "message": "Información de usuario actualizada correctamente"
}
```

---

# `getAllUsers()`

Obtiene todos los usuarios registrados.

Antes de devolverlos, elimina el campo sensible:

```ts
password_hash;
```

Por lo tanto, la contraseña encriptada nunca se envía en la respuesta.

### Respuesta

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "nombre_completo": "Juan Pérez",
      "correo": "juan@email.com",
      "telefono": "5551234567",
      "rol": "cliente"
    }
  ]
}
```

---

# `checkSession()`

Comprueba si existe una sesión activa.

### Proceso

Utiliza:

```ts
session.sessionExist();
```

y posteriormente comprueba:

```ts
req.session?.user;
```

### Sesión activa — `200 OK`

```json
{
  "success": true,
  "message": "Usuario autenticado",
  "user": {
    "id": "1",
    "email": "usuario@email.com",
    "nombre": "Juan Pérez",
    "tipo": "cliente"
  }
}
```

### Sin sesión — `401 Unauthorized`

```json
{
  "success": false,
  "message": "Usuario no autenticado"
}
```

# Rutas

Las rutas principales de autenticación se registran de la siguiente manera:

```ts
router.post("/login", async (req, res) => {
  await Auth.login(req, res);
});

router.post("/register", async (req, res) => {
  await Auth.register(req, res);
});

router.post("/logout", async (req, res) => {
  await Auth.logout(req, res);
});
```

## Resumen de endpoints

| Método | Endpoint    | Descripción                  |
| ------ | ----------- | ---------------------------- |
| `POST` | `/login`    | Inicia sesión de un usuario. |
| `POST` | `/register` | Registra un nuevo usuario.   |
| `POST` | `/logout`   | Cierra la sesión actual.     |

---

# Flujo general de autenticación

```text
Cliente
   │
   ├── POST /register
   │       │
   │       ├── Validar datos
   │       ├── Validar correo
   │       ├── Validar contraseña
   │       ├── Verificar usuario existente
   │       ├── Hashear contraseña
   │       └── Crear usuario
   │
   ├── POST /login
   │       │
   │       ├── Validar correo
   │       ├── Buscar usuario
   │       ├── Comparar contraseña
   │       └── Crear sesión
   │
   └── POST /logout
           │
           └── Destruir sesión
```

# Seguridad

- Las contraseñas nunca se almacenan directamente; se guardan mediante un hash generado con `Bcrypt`.
- Durante el login, la contraseña recibida se compara contra el hash almacenado.
- `getAllUsers()` elimina `password_hash` antes de enviar los usuarios al cliente.
- Al eliminar un usuario, también se destruye su sesión activa.
- La información de la sesión utiliza únicamente los datos necesarios del usuario:

```ts
{
  (id, email, nombre, tipo);
}
```

# Endpoints de productos

## `GET /api/productos/products`

Obtiene la lista completa de productos disponibles en el sistema.

### Autenticación

No requiere autenticación.

### Request Body

No recibe información en el `body`.

### Parámetros

No requiere parámetros.

### Ejemplo de petición

```http
GET /api/productos/products
```

### Respuesta exitosa — `200 OK`

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

### Error — `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Error al obtener la lista de productos"
}
```

---

# `GET /api/productos/product/:id`

Obtiene la información de un producto específico mediante su ID.

### Autenticación

No requiere autenticación.

### Parámetros de URL

| Parámetro | Tipo     | Obligatorio | Descripción                             |
| --------- | -------- | ----------- | --------------------------------------- |
| `id`      | `string` | Sí          | ID del producto que se desea consultar. |

### Ejemplo

```http
GET /api/productos/product/1
```

### Respuesta exitosa — `200 OK`

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

#### `400 Bad Request`

Cuando no se proporciona el ID:

```json
{
  "success": false,
  "message": "El parámetro ID es requerido"
}
```

#### `404 Not Found`

Cuando el producto no existe:

```json
{
  "success": false,
  "message": "Producto no encontrado"
}
```

#### `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Error al obtener el producto"
}
```

---

# `POST /api/productos/product`

Crea un nuevo producto y permite subir una imagen de portada junto con imágenes adicionales para la galería.

### Autenticación

**Sí.** Requiere `authMiddleware`.

### Content-Type

La petición debe utilizar:

```http
Content-Type: multipart/form-data
```

### Archivos

El endpoint utiliza dos campos para las imágenes:

| Campo     | Tipo     | Obligatorio | Descripción                              |
| --------- | -------- | ----------- | ---------------------------------------- |
| `imagen`  | `File`   | Sí          | Imagen principal o portada del producto. |
| `galeria` | `File[]` | No          | Imágenes adicionales del producto.       |

La imagen principal se almacena como `imagen_url` del producto.

Las imágenes enviadas mediante `galeria` se registran como imágenes secundarias.

### Campos del producto

| Campo                  | Tipo           | Obligatorio      | Descripción                                  |
| ---------------------- | -------------- | ---------------- | -------------------------------------------- |
| `nombre`               | `string`       | Según validación | Nombre del producto.                         |
| `descripcion`          | `string`       | Según validación | Descripción del producto.                    |
| `precios`              | `JSON / array` | Según validación | Precios del producto.                        |
| `descuento_porcentaje` | `number`       | No               | Porcentaje de descuento aplicado.            |
| `stock`                | `number`       | Según validación | Cantidad disponible.                         |
| `categorias_ids`       | `JSON / array` | Según validación | IDs de las categorías asociadas al producto. |

> Los campos exactos obligatorios y sus restricciones son determinados por `Validator.validateProducto()`.

### Ejemplo con `form-data`

```text
nombre: Camiseta deportiva
descripcion: Camiseta deportiva de alta calidad
precios: [
  {"tipo_precio": "Detal", "precio": 25.00}, {"tipo_precio": "Mayor", "precio": 20.00}, {"tipo_precio": "GranMayor", "precio": 18.00}
  ]
descuento_porcentaje: 10
stock: 25
categorias_ids: [1, 3]

imagen: camiseta.jpg
galeria: camiseta-frente.jpg
galeria: camiseta-atras.jpg
```

### `categorias_ids`

Este campo se recibe como texto JSON dentro de `multipart/form-data`.

Ejemplo:

```text
categorias_ids: [1, 3, 5]
```

El controlador lo convierte a un array mediante:

```ts
JSON.parse(request.body.categorias_ids);
```

### Proceso

1. Recibe los datos mediante `multipart/form-data`.
2. Obtiene la imagen principal desde el campo `imagen`.
3. Obtiene las imágenes secundarias desde `galeria`.
4. Convierte `precio`, `descuento_porcentaje` y `stock` a números.
5. Convierte `categorias_ids` desde JSON a un array.
6. Valida los datos mediante `Validator.validateProducto()`.
7. Construye la URL de la imagen principal.
8. Crea el producto en la base de datos.
9. Guarda las imágenes de la galería asociadas al producto.
10. Devuelve el producto creado.

### Respuesta exitosa — `201 Created`

```json
{
  "success": true,
  "message": "Producto creado exitosamente con su galería",
  "data": {
    "id": "1",
    "nombre": "Camiseta deportiva",
    "descripcion": "Camiseta deportiva de alta calidad",
    "precio": 29.99,
    "descuento_porcentaje": 10,
    "stock": 25,
    "imagen_url": "http://localhost:3000/uploads/productos/camiseta.jpg"
  }
}
```

### Errores

#### `400 Bad Request` — Imagen obligatoria

```json
{
  "success": false,
  "message": "La imagen de portada es obligatoria"
}
```

#### `400 Bad Request` — Error de validación

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

---

# `PUT /api/productos/product/:id`

Actualiza la información de un producto existente.

También permite reemplazar la imagen de portada.

### Autenticación

**Sí.** Requiere `authMiddleware`.

### Content-Type

Si se actualiza la imagen, la petición debe utilizar:

```http
Content-Type: multipart/form-data
```

### Parámetros de URL

| Parámetro | Tipo     | Obligatorio | Descripción                              |
| --------- | -------- | ----------- | ---------------------------------------- |
| `id`      | `string` | Sí          | ID del producto que se desea actualizar. |

### Campos recibidos

| Campo                  | Tipo      | Obligatorio | Descripción                    |
| ---------------------- | --------- | ----------- | ------------------------------ |
| `nombre`               | `string`  | si          | Nuevo nombre del producto.     |
| `descripcion`          | `string`  | si          | Nueva descripción.             |
| `precio`               | `number`  | si          | Nuevo precio.                  |
| `descuento_porcentaje` | `number`  | si          | Nuevo porcentaje de descuento. |
| `stock`                | `number`  | si          | Nuevo stock.                   |
| `estado`               | `boolean` | si          | Estado del producto.           |
| `imagen`               | `File`    | si          | Nueva imagen de portada.       |

> Los campos disponibles y sus restricciones son validados mediante `Validator.validateActualizarProducto()`.

### Ejemplo sin cambiar imagen

```text
PUT /api/productos/product/1
```

```text
nombre: Camiseta deportiva premium
precio: 34.99
stock: 30
estado: true
```

### Ejemplo cambiando imagen

```text
PUT /api/productos/product/1
```

```text
nombre: Camiseta deportiva premium
precio: 34.99
imagen: camiseta-nueva.jpg
```

### Proceso

1. Obtiene el ID desde los parámetros de la URL.
2. Obtiene los datos enviados.
3. Convierte los valores numéricos a `number`.
4. Convierte `estado` a `boolean`.
5. Valida los datos.
6. Comprueba que el producto exista.
7. Mantiene la imagen actual si no se envía una nueva.
8. Genera una nueva URL si se proporciona una imagen.
9. Actualiza el producto en la base de datos.
10. Devuelve el producto actualizado.

### Respuesta exitosa — `200 OK`

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

### Errores

#### `400 Bad Request`

Error de validación:

```json
{
  "success": false,
  "message": "Error de validación",
  "errors": {}
}
```

#### `404 Not Found`

Cuando el producto no existe:

```json
{
  "success": false,
  "message": "El producto a actualizar no existe"
}
```

---

# `DELETE /api/productos/product/:id`

Elimina un producto existente.

### Autenticación

**Sí.** Requiere `authMiddleware`.

### Parámetros de URL

| Parámetro | Tipo     | Obligatorio | Descripción                            |
| --------- | -------- | ----------- | -------------------------------------- |
| `id`      | `string` | Sí          | ID del producto que se desea eliminar. |

### Ejemplo

```http
DELETE /api/productos/product/1
```

### Proceso

1. Obtiene el ID desde los parámetros de la URL.
2. Comprueba que el ID haya sido proporcionado.
3. Busca el producto en la base de datos.
4. Verifica que el producto exista.
5. Elimina el producto mediante `eliminarProducto()`.
6. Devuelve una confirmación.

### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "message": "Producto eliminado exitosamente"
}
```

### Errores

#### `400 Bad Request`

```json
{
  "success": false,
  "message": "El parámetro ID es requerido"
}
```

#### `404 Not Found`

```json
{
  "success": false,
  "message": "Producto no encontrado"
}
```

#### `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Error al eliminar el producto"
}
```

---

# Resumen de endpoints

| Método   | Endpoint                     | Auth | Descripción                  |
| -------- | ---------------------------- | ---: | ---------------------------- |
| `GET`    | `/api/productos/products`    |   ❌ | Obtener todos los productos. |
| `GET`    | `/api/productos/product/:id` |   ❌ | Obtener un producto por ID.  |
| `POST`   | `/api/productos/product`     |   ✅ | Crear un producto.           |
| `PUT`    | `/api/productos/product/:id` |   ✅ | Actualizar un producto.      |
| `DELETE` | `/api/productos/product/:id` |   ✅ | Eliminar un producto.        |

---

# Middlewares utilizados

## `authMiddleware`

Se utiliza en las operaciones que modifican información:

```ts
router.post("/product", authMiddleware, ...);
router.put("/product/:id", authMiddleware, ...);
router.delete("/product/:id", authMiddleware, ...);
```

Su función es comprobar que el usuario tenga una sesión/autorización válida antes de realizar la operación.

## `handleProductoUpload`

Se utiliza en:

```ts
router.post("/product", authMiddleware, handleProductoUpload, ...);

router.put("/product/:id", authMiddleware, handleProductoUpload, ...);
```

Permite procesar las imágenes enviadas mediante `multipart/form-data`.

Los archivos se organizan en:

```ts
imagen;
galeria;
```

Las imágenes se almacenan y posteriormente se construyen sus URLs utilizando:

```text
/uploads/productos/
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

> **Nota:** Los campos obligatorios, tipos y restricciones específicas de los productos dependen de los esquemas utilizados por `Validator.validateProducto()` y `Validator.validateActualizarProducto()`.

## Agregar otro campo al usuario sobre la fecha de nacimiento

## Seguimiento del usuario por correo, como 3 al mes

## Automatizacion de proceso sobre decuento de cumpleaños

buscar con srm

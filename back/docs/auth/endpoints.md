# 🚪 Endpoints de autenticación

## `POST /login`

Permite autenticar a un usuario utilizando su correo electrónico y contraseña.

### Request Body

| Campo        | Tipo     | Obligatorio | Descripción                    |
| ------------ | -------- | ----------- | ------------------------------ |
| `correo`     | `string` | Sí\*        | Correo electrónico del usuario |
| `email`      | `string` | Sí\*        | Alias de `correo`              |
| `password`   | `string` | Sí\*        | Contraseña del usuario         |
| `contrasena` | `string` | Sí\*        | Alias de `password`            |

Se debe proporcionar `correo` o `email`, y `password` o `contrasena`.

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

```json
{
  "success": false,
  "message": "Correo y contraseña son requeridos"
}
```

Correo inválido:

```json
{
  "success": false,
  "message": "Correo electrónico inválido"
}
```

#### `401 Unauthorized`

Usuario inexistente:

```json
{
  "success": false,
  "message": "Usuario no encontrado"
}
```

Contraseña incorrecta:

```json
{
  "success": false,
  "message": "Contraseña incorrecta"
}
```

#### `500 Internal Server Error`

```json
{
  "success": false,
  "message": "Error interno en el servidor durante el inicio de sesión"
}
```

---

# `POST /register`

Permite registrar un nuevo usuario en el sistema.

## Request Body

| Campo             | Tipo     | Obligatorio | Descripción                 |
| ----------------- | -------- | ----------- | --------------------------- |
| `nombre_completo` | `string` | Sí          | Nombre completo del usuario |
| `correo`          | `string` | Sí          | Correo electrónico          |
| `password`        | `string` | Sí\*        | Contraseña                  |
| `contrasena`      | `string` | Sí\*        | Alias de `password`         |
| `telefono`        | `string` | No          | Número telefónico           |
| `rol`             | `string` | No          | Rol del usuario             |

Se debe proporcionar `password` o `contrasena`.

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

1. Obtiene los datos enviados.
2. Normaliza el correo.
3. Verifica campos obligatorios.
4. Valida el formato del correo.
5. Valida la seguridad de la contraseña.
6. Comprueba que el correo no exista.
7. Encripta la contraseña utilizando `Bcrypt`.
8. Construye el objeto `CrearUsuarioDTO`.
9. Guarda el usuario mediante `repository.crearUsuario()`.
10. Retorna el ID creado.

### Rol predeterminado

Si no se especifica un rol, el usuario se registra como:

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

```json
{
  "success": false,
  "message": "Los campos nombre_completo, correo y contraseña son obligatorios"
}
```

Correo inválido:

```json
{
  "success": false,
  "message": "Correo electrónico inválido"
}
```

Contraseña insegura:

```json
{
  "success": false,
  "message": "La contraseña no cumple con los requisitos mínimos de seguridad"
}
```

#### `409 Conflict`

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

## Request Body

No requiere información en el body.

La sesión se obtiene directamente desde:

```ts
req.session;
```

### Proceso

1. Recibe la petición.
2. Delega la destrucción a `Session.destroySession()`.
3. Finaliza la sesión actual.

### Ejemplo

```http
POST /logout
```

La respuesta es generada por `Session.destroySession()`.

# 🔐 Nuevos endpoints de autenticación

## `POST /google-auth`

Permite autenticar a un usuario utilizando un token de autenticación proporcionado por Google.

El endpoint valida el `idToken` utilizando `Google OAuth2`. Si el usuario no existe, se crea automáticamente como usuario de tipo `cliente`. Si el usuario ya existe pero todavía no tiene vinculado su `id_google`, se vincula la cuenta de Google al usuario existente.

### Request Body

| Campo     | Tipo     | Obligatorio | Descripción                                |
| --------- | -------- | ----------- | ------------------------------------------ |
| `idToken` | `string` | Sí          | Token de autenticación generado por Google |

### Ejemplo

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

### Proceso

1. Obtiene el `idToken` enviado en el body.
2. Verifica que el token exista y sea un `string`.
3. Valida el token mediante `Google OAuth2`.
4. Utiliza `GOOGLE_CLIENT_ID` como audiencia esperada.
5. Obtiene del token el correo, nombre, identificador de Google e imagen del usuario.
6. Normaliza el correo electrónico a minúsculas y elimina espacios.
7. Busca al usuario mediante su correo electrónico.
8. Si el usuario no existe, crea automáticamente un usuario de Google.
9. El usuario creado recibe el rol `cliente`.
10. Si el usuario ya existe y no tiene `id_google`, vincula su cuenta de Google.
11. Obtiene nuevamente el usuario desde la base de datos.
12. Construye la información del usuario para la sesión.
13. Crea la sesión mediante `Session.createSession()`.

### Configuración requerida

El servidor debe tener configurada la variable de entorno:

```env
GOOGLE_CLIENT_ID=tu_google_client_id
```

Esta variable se utiliza tanto para inicializar el cliente OAuth2 como para validar la audiencia del token recibido.

### Registro automático mediante Google

Cuando el correo recibido desde Google no existe en la base de datos, se crea automáticamente el usuario utilizando:

```text
rol: cliente
password_hash: ""
id_google: ID proporcionado por Google
avatar_url: imagen proporcionada por Google
```

El nombre se obtiene del perfil de Google y, si no está disponible, se utiliza:

```text
Usuario de Google
```

### Vinculación de cuenta existente

Si el correo de Google ya pertenece a un usuario registrado y este usuario todavía no tiene un `id_google`, se vincula el identificador de Google a la cuenta existente.

```text
Usuario existente
        ↓
¿Tiene id_google?
   ↓             ↓
  Sí             No
  ↓              ↓
Continuar    Vincular Google
        \       /
         \     /
       Crear sesión
```

### Respuesta exitosa

La creación de la sesión se realiza mediante:

```ts
Session.createSession();
```

El controlador no construye un JSON propio para la respuesta exitosa, sino que retorna la respuesta generada por el sistema de sesiones.

### Errores

#### `400 Bad Request`

Cuando no se proporciona `idToken` o no es un `string`:

```json
{
  "success": false,
  "message": "El parámetro idToken es requerido"
}
```

#### `401 Unauthorized`

Token inválido o sin correo asociado:

```json
{
  "success": false,
  "message": "Token de Google no válido o sin correo asociado"
}
```

Error durante la autenticación con Google o token expirado:

```json
{
  "success": false,
  "message": "Error al autenticar con Google o token expirado"
}
```

#### `500 Internal Server Error`

Cuando no se puede procesar correctamente el usuario de Google en la base de datos:

```json
{
  "success": false,
  "message": "Error al procesar el usuario de Google en la base de datos"
}
```

---

# `PUT /update-user`

Permite actualizar la información de un usuario existente.

El usuario puede ser identificado mediante la sesión actual o mediante un identificador enviado en la petición. Se pueden actualizar el nombre, correo, teléfono y contraseña.

## Request Body

| Campo             | Tipo     | Obligatorio | Descripción                       |
| ----------------- | -------- | ----------- | --------------------------------- |
| `id_usuario`      | `string` | No\*        | ID del usuario                    |
| `usuarioId`       | `string` | No\*        | Alias para identificar al usuario |
| `nombre_completo` | `string` | No          | Nuevo nombre completo             |
| `correo`          | `string` | No          | Nuevo correo electrónico          |
| `telefono`        | `string` | No          | Nuevo número telefónico           |
| `newPassword`     | `string` | No          | Nueva contraseña                  |

- El ID puede obtenerse directamente desde la sesión. También puede enviarse mediante `id_usuario`, `usuarioId`, query string o parámetros de ruta.

### Ejemplo

```json
{
  "nombre_completo": "Juan Pérez",
  "correo": "juan.nuevo@email.com",
  "telefono": "5551234567"
}
```

### Actualizar contraseña

También es posible actualizar únicamente la contraseña:

```json
{
  "newPassword": "NuevaPassword123"
}
```

### Actualizar varios campos

```json
{
  "nombre_completo": "Juan Pérez",
  "correo": "juan.nuevo@email.com",
  "telefono": "5551234567",
  "newPassword": "NuevaPassword123"
}
```

### Proceso

1. Obtiene el ID del usuario.
2. Primero intenta obtenerlo desde `req.session.user.id`.
3. Si no existe en sesión, busca `id_usuario`, `usuarioId`, query o params.
4. Verifica que exista un ID válido.
5. Verifica que se haya enviado al menos un campo para actualizar.
6. Si se proporciona `newPassword`, valida la seguridad de la contraseña.
7. Encripta la nueva contraseña utilizando `Bcrypt`.
8. Actualiza la contraseña si corresponde.
9. Construye el objeto de actualización del usuario.
10. Actualiza nombre, correo y teléfono cuando fueron proporcionados.
11. Retorna una respuesta de confirmación.

### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "message": "Información de usuario actualizada correctamente"
}
```

### Errores

#### `400 Bad Request`

ID de usuario ausente:

```json
{
  "success": false,
  "message": "ID de usuario inválido"
}
```

No se enviaron campos para actualizar:

```json
{
  "success": false,
  "message": "Debe proporcionar al menos un campo para actualizar"
}
```

Contraseña no válida:

```json
{
  "success": false,
  "message": "Contraseña no válida"
}
```

#### `500 Internal Server Error`

```json
{
  "success": false,
  "message": "No se pudo actualizar la cuenta del usuario"
}
```

---

# `DELETE /delete-user`

Permite eliminar la cuenta de un usuario.

Después de eliminar el usuario, también se destruye la sesión actual si existe.

## Request Body

Puede utilizarse el ID del usuario mediante:

| Campo        | Tipo     | Obligatorio | Descripción                |
| ------------ | -------- | ----------- | -------------------------- |
| `id_usuario` | `string` | No\*        | ID del usuario             |
| `usuarioId`  | `string` | No\*        | ID alternativo del usuario |

- Si existe una sesión activa, el ID se obtiene directamente desde `req.session.user.id`.

También puede recibirse mediante query string o parámetros de ruta.

### Ejemplo

```json
{
  "id_usuario": "123"
}
```

También puede utilizarse:

```json
{
  "usuarioId": "123"
}
```

### Proceso

1. Obtiene el ID del usuario.
2. Primero intenta obtenerlo desde la sesión.
3. Si no existe, busca el ID en el body, query o params.
4. Verifica que exista un ID válido.
5. Elimina el usuario mediante `repository.eliminarUsuario()`.
6. Destruye la sesión actual si existe.
7. Retorna una confirmación de eliminación.

### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "message": "La cuenta de usuario ha sido eliminada exitosamente"
}
```

### Errores

#### `400 Bad Request`

```json
{
  "success": false,
  "message": "ID de usuario inválido o ausente"
}
```

#### `500 Internal Server Error`

```json
{
  "success": false,
  "message": "No se pudo eliminar la cuenta de usuario"
}
```

---

# `GET /check-session`

Permite comprobar si existe una sesión autenticada actualmente.

No requiere información en el body.

## Request Body

No requiere información en el body.

### Ejemplo

```http
GET /check-session
```

### Proceso

1. Recibe la petición.
2. Comprueba si existe una sesión mediante `Session.sessionExist()`.
3. Verifica que la sesión contenga información del usuario.
4. Si existe una sesión válida, retorna la información del usuario.
5. Si no existe una sesión válida, retorna `401 Unauthorized`.

### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "message": "Usuario autenticado",
  "user": {
    "id": "123",
    "email": "usuario@email.com",
    "nombre": "Juan Pérez",
    "tipo": "cliente"
  }
}
```

El objeto `user` corresponde a la información almacenada en `req.session.user`.

### Errores

#### `401 Unauthorized`

Cuando no existe una sesión autenticada:

```json
{
  "success": false,
  "message": "Usuario no autenticado"
}
```

---

# Resumen de nuevos endpoints

| Método   | Endpoint         | Descripción                                     |
| -------- | ---------------- | ----------------------------------------------- |
| `POST`   | `/google-auth`   | Autentica o registra un usuario mediante Google |
| `PUT`    | `/update-user`   | Actualiza información de un usuario             |
| `DELETE` | `/delete-user`   | Elimina la cuenta de un usuario                 |
| `GET`    | `/check-session` | Comprueba si existe una sesión autenticada      |

## Rutas completas

Considerando el router de autenticación:

```ts
router.post("/login", (req, res) => Auth.login(req, res));
router.post("/register", (req, res) => Auth.register(req, res));
router.post("/logout", (req, res) => Auth.logout(req, res));
router.post("/google-auth", (req, res) => Auth.googleAuth(req, res));
router.put("/update-user", (req, res) => Auth.updateUser(req, res));
router.delete("/delete-user", (req, res) => Auth.deleteUser(req, res));
router.get("/check-session", (req, res) => Auth.checkSession(req, res));
```

De esta forma, los nuevos endpoints se integran con los tres endpoints que ya estaban documentados: `login`, `register` y `logout`.

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

# Recuperación de contraseña

## 1. Descripción general

Este módulo permite a los usuarios recuperar el acceso a su cuenta mediante un código de verificación enviado a su correo electrónico y posteriormente establecer una nueva contraseña.

El proceso consta de dos endpoints:

| Método | Endpoint           | Descripción                                                |
| ------ | ------------------ | ---------------------------------------------------------- |
| POST   | `/forgot-password` | Solicita un código de recuperación por correo electrónico. |
| POST   | `/reset-password`  | Verifica el código y actualiza la contraseña del usuario.  |

**Tecnologías y componentes involucrados:**

- Express para gestionar las solicitudes HTTP.
- `Auth` para la lógica de autenticación.
- `UserRepository` para las operaciones con la base de datos.
- Servicio de correo electrónico para enviar el código.
- Servicio de validación de contraseñas.
- Servicio de hash para almacenar la contraseña de forma segura.

---

## 2. Endpoint: Solicitar recuperación de contraseña

### `POST /forgot-password`

**Descripción:** Permite solicitar un código de recuperación de contraseña mediante el correo electrónico registrado en el sistema.

### Request

**Headers**

| Campo          | Valor              |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |

**Body**

```json
{
  "correo": "usuario@ejemplo.com"
}
```

| Parámetro | Tipo     | Obligatorio | Descripción                              |
| --------- | -------- | ----------- | ---------------------------------------- |
| `correo`  | `string` | Sí          | Correo electrónico asociado a la cuenta. |

### Proceso interno

1. Recibe el correo electrónico desde el cuerpo de la solicitud.
2. Elimina los espacios al inicio y al final y convierte el correo a minúsculas.
3. Verifica que el correo no esté vacío.
4. Busca al usuario mediante `getUsuarioPorCorreo`.
5. Genera un código numérico aleatorio de seis dígitos.
6. Establece una fecha de expiración de 15 minutos.
7. Guarda el código y su fecha de expiración mediante `guardarResetToken`.
8. Envía el código al correo electrónico del usuario.
9. Devuelve una respuesta indicando que el código fue enviado.

### Respuestas

**200 OK — Solicitud procesada correctamente**

```json
{
  "success": true,
  "message": "Se ha enviado un código de recuperación a tu correo electrónico"
}
```

**400 Bad Request — Correo requerido**

```json
{
  "success": false,
  "message": "El correo es requerido"
}
```

**404 Not Found — Usuario no encontrado**

```json
{
  "success": false,
  "message": "Usuario no encontrado"
}
```

**500 Internal Server Error — Error durante el procesamiento**

```json
{
  "success": false,
  "message": "Error al procesar la solicitud"
}
```

### Consideraciones

- El código de recuperación tiene seis dígitos.
- El código tiene una vigencia de 15 minutos.
- El código se almacena en la base de datos junto con su fecha de expiración.
- Si el envío del correo falla, el endpoint devuelve un error 500, aunque el código ya podría haberse guardado en la base de datos.

---

## 3. Endpoint: Restablecer contraseña

### `POST /reset-password`

**Descripción:** Permite establecer una nueva contraseña después de verificar el código de recuperación enviado al correo electrónico.

### Request

**Headers**

| Campo          | Valor              |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |

**Body**

```json
{
  "correo": "usuario@ejemplo.com",
  "codigo": "583921",
  "nuevaPassword": "NuevaClaveSegura123!"
}
```

| Parámetro       | Tipo     | Obligatorio | Descripción                                                 |
| --------------- | -------- | ----------- | ----------------------------------------------------------- |
| `correo`        | `string` | Sí          | Correo electrónico asociado a la cuenta.                    |
| `codigo`        | `string` | Sí          | Código de recuperación de seis dígitos recibido por correo. |
| `nuevaPassword` | `string` | Sí          | Nueva contraseña que se desea establecer.                   |

### Proceso interno

1. Recibe el correo, el código de recuperación y la nueva contraseña.
2. Normaliza el correo electrónico.
3. Verifica que los tres parámetros sean obligatorios.
4. Valida la nueva contraseña mediante `validatePassword`.
5. Busca al usuario por su correo electrónico.
6. Comprueba que exista un código de recuperación y una fecha de expiración.
7. Verifica que el código coincida con el almacenado en la base de datos.
8. Comprueba que el código no haya expirado.
9. Genera un hash de la nueva contraseña mediante `bcrypt.hash`.
10. Actualiza la contraseña y elimina el código de recuperación mediante `actualizarPasswordYLimpiarToken`.
11. Devuelve una respuesta indicando que la contraseña se actualizó correctamente.

### Respuestas

**200 OK — Contraseña actualizada correctamente**

```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente. Ya puedes iniciar sesión."
}
```

**400 Bad Request — Parámetros obligatorios faltantes**

```json
{
  "success": false,
  "message": "Correo, código y nueva contraseña son obligatorios"
}
```

**400 Bad Request — Contraseña no válida**

```json
{
  "success": false,
  "message": "La contraseña no cumple con los requisitos de seguridad"
}
```

**400 Bad Request — Código inválido o expirado**

```json
{
  "success": false,
  "message": "Código inválido o expirado"
}
```

Esta respuesta también se produce cuando el usuario no existe o no tiene un código de recuperación almacenado.

**400 Bad Request — Código incorrecto o expirado**

```json
{
  "success": false,
  "message": "El código es incorrecto o ha expirado"
}
```

**500 Internal Server Error — Error al restablecer la contraseña**

```json
{
  "success": false,
  "message": "Error al restablecer la contraseña"
}
```

### Consideraciones

- La nueva contraseña debe cumplir las reglas definidas en `validatePassword`.
- La contraseña se almacena como un hash, no como texto plano.
- El código de recuperación solo puede utilizarse mientras esté vigente.
- Tras actualizar la contraseña, el código y su fecha de expiración se establecen en `NULL`.

---

## 4. Método de repositorio: `guardarResetToken`

### Descripción

Guarda el código de recuperación y su fecha de expiración para un usuario específico.

### Parámetros

| Posición | Parámetro             | Tipo     | Descripción                            |
| -------- | --------------------- | -------- | -------------------------------------- |
| `$1`     | `reset_token`         | `string` | Código de recuperación generado.       |
| `$2`     | `reset_token_expires` | `Date`   | Fecha y hora de expiración del código. |
| `$3`     | `id`                  | `string` | Identificador del usuario.             |

**Orden de los parámetros:**

```typescript
[reset_token, reset_token_expires, id];
```

### Resultado

Devuelve los datos básicos del usuario actualizado, siempre que exista un registro con el identificador proporcionado.

Los campos devueltos son:

- `id`
- `nombre_completo`
- `correo`
- `telefono`
- `rol`
- `fecha_creacion`

---

## 5. Método de repositorio: `actualizarPasswordYLimpiarToken`

### Descripción

Actualiza el hash de la contraseña del usuario y elimina los datos del proceso de recuperación para impedir que el mismo código vuelva a utilizarse.

### Parámetros

| Posición | Parámetro       | Tipo     | Descripción                  |
| -------- | --------------- | -------- | ---------------------------- |
| `$1`     | `password_hash` | `string` | Hash de la nueva contraseña. |
| `$2`     | `id`            | `string` | Identificador del usuario.   |

**Orden de los parámetros:**

```typescript
[password_hash, id];
```

### Resultado

Devuelve los datos básicos del usuario actualizado, siempre que exista un registro con el identificador proporcionado.

La consulta realiza tres operaciones:

1. Actualiza `password_hash` con el hash de la nueva contraseña.
2. Establece `reset_token` en `NULL`.
3. Establece `reset_token_expires` en `NULL`.

Estas operaciones se ejecutan en una única sentencia SQL.

---

## 6. Configuración de rutas

Las rutas se registran mediante Express de la siguiente manera:

```typescript
router.post("/forgot-password", (req, res) => Auth.forgotPassword(req, res));

router.post("/reset-password", (req, res) => Auth.resetPassword(req, res));
```

La URL completa de cada endpoint depende del prefijo con el que se monte el router en la aplicación.

Por ejemplo, si el router está montado en `/api/auth`, las rutas serían:

- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

---

## 7. Flujo completo de recuperación

1. El usuario introduce su correo electrónico.
2. El frontend envía una petición a `/forgot-password`.
3. El backend genera y guarda un código de recuperación.
4. El usuario recibe el código por correo electrónico.
5. El usuario introduce el código y su nueva contraseña.
6. El frontend envía una petición a `/reset-password`.
7. El backend valida el código, la expiración y los requisitos de la contraseña.
8. El backend actualiza el hash de la contraseña y elimina el código de recuperación.
9. El usuario puede iniciar sesión con su nueva contraseña.

---

## 8. Recomendaciones de seguridad

- **Evitar enumeración de usuarios:** responder con un mensaje genérico tanto si el correo existe como si no, para no revelar qué cuentas están registradas.
- **Generar códigos seguros:** utilizar un generador criptográficamente seguro, como `crypto.randomInt`, en lugar de `Math.random()`.
- **Limitar intentos:** implementar límites de solicitudes de recuperación y de intentos de validación del código.
- **Almacenar el código de forma segura:** considerar guardar un hash del código en lugar del código en texto plano.
- **Validar el tipo de los datos:** comprobar que `correo`, `codigo` y `nuevaPassword` sean cadenas antes de aplicar métodos como `trim()`.
- **Invalidar sesiones si corresponde:** evaluar la revocación de sesiones o tokens de acceso existentes después de cambiar la contraseña.
- **Verificar las actualizaciones SQL:** comprobar que las operaciones afecten al usuario esperado y gestionar posibles fallos de persistencia.
- **Evitar códigos reutilizables:** limpiar el código y su expiración después de restablecer correctamente la contraseña, como ya hace `actualizarPasswordYLimpiarToken`.

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
router.post("/forgot-password", (req, res) => Auth.forgotPassword(req, res));
router.post("/reset-password", (req, res) => Auth.resetPassword(req, res));
```

De esta forma, los nuevos endpoints se integran con los tres endpoints que ya estaban documentados: `login`, `register` y `logout`.

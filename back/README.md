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

---

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

# Dependencias utilizadas

La clase `Auth` utiliza los siguientes componentes:

### `Session`

Gestiona las sesiones del usuario:

```ts
Session.createSession();
Session.destroySession();
Session.sessionExist();
```

### `Validator`

Realiza validaciones de datos:

```ts
Validator.validateEmail();
Validator.validatePassword();
```

### `LinkRepository`

Gestiona las operaciones relacionadas con usuarios en la base de datos:

```ts
getUsuarioPorCorreo();
crearUsuario();
eliminarUsuario();
actualizarPassword();
actualizarUsuario();
getUsuarios();
```

### `Bcrypt`

Gestiona las contraseñas:

```ts
Bcrypt.hash();
Bcrypt.compare();
```

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

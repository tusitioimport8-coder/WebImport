# 🚪 Endpoints de autenticación

## `POST /login`

Permite autenticar a un usuario utilizando su correo electrónico y contraseña.

### Request Body

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `correo` | `string` | Sí* | Correo electrónico del usuario |
| `email` | `string` | Sí* | Alias de `correo` |
| `password` | `string` | Sí* | Contraseña del usuario |
| `contrasena` | `string` | Sí* | Alias de `password` |

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

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `nombre_completo` | `string` | Sí | Nombre completo del usuario |
| `correo` | `string` | Sí | Correo electrónico |
| `password` | `string` | Sí* | Contraseña |
| `contrasena` | `string` | Sí* | Alias de `password` |
| `telefono` | `string` | No | Número telefónico |
| `rol` | `string` | No | Rol del usuario |

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

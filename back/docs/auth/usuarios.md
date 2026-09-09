# 👤 Gestión de usuarios

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

Si no encuentra ninguno:

```ts
null;
```

---

# `deleteUser()`

Elimina un usuario del sistema.

## Obtención del ID

Utiliza:

```ts
resolveUserId();
```

Por lo tanto, el ID puede recibirse mediante sesión, body, query o params.

### Proceso

1. Obtiene el ID.
2. Verifica que exista.
3. Elimina el usuario mediante:

```ts
repository.eliminarUsuario(usuarioId);
```

4. Destruye la sesión activa si existe.
5. Retorna una confirmación.

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

## Campos recibidos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `nombre_completo` | `string` | No | Nuevo nombre |
| `correo` | `string` | No | Nuevo correo |
| `telefono` | `string` | No | Nuevo teléfono |
| `newPassword` | `string` | No | Nueva contraseña |

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

### Respuesta

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

Por lo tanto, la contraseña encriptada no se envía en la respuesta.

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

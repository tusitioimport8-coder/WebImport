# 🛡️ Seguridad

## Contraseñas

Las contraseñas no se almacenan directamente.

Se guardan mediante un hash generado utilizando `Bcrypt`.

Durante el inicio de sesión, la contraseña recibida se compara contra el hash almacenado.

## Información sensible

El método `getAllUsers()` elimina:

```ts
password_hash;
```

antes de devolver los usuarios al cliente.

## Eliminación de cuentas

Al eliminar un usuario, también se destruye su sesión activa.

## Información de sesión

La sesión utiliza únicamente los datos necesarios del usuario:

```ts
{
  id,
  email,
  nombre,
  tipo
}
```

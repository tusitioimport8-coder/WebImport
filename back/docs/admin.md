# Módulo de administración

## Descripción

El módulo de administración permite gestionar los usuarios registrados y modificar sus roles. Todas sus rutas están protegidas mediante autenticación y autorización por rol.

El acceso está reservado a usuarios autenticados con el rol `ADMIN`.

## Control de acceso

Las rutas se montan bajo el prefijo `/api/admin` mediante los middlewares `authMiddleware` y `requireRole("ADMIN")`.

- `authMiddleware`: comprueba la autenticación de la petición.
- `requireRole("ADMIN")`: limita el acceso a usuarios con rol de administrador.
- Las rutas de `adminRoutes.ts` heredan esta protección al registrarse bajo el router `/admin`.

Los permisos deben verificarse en el servidor. Ocultar botones o secciones en el frontend no sustituye la autorización del backend.

## Endpoints

| Método  | Endpoint                      | Descripción                       |
| ------- | ----------------------------- | --------------------------------- |
| `GET`   | `/api/admin/usuarios`         | Obtiene los usuarios registrados. |
| `PATCH` | `/api/admin/usuarios/:id/rol` | Actualiza el rol de un usuario.   |

### 1. Listar usuarios

**Endpoint:** `GET /api/admin/usuarios`

**Permiso:** `ADMIN`.

**Funcionamiento:**

1. El middleware comprueba la autenticación y el rol.
2. El controlador llama a `obtenerTodosLosUsuarios()` del repositorio.
3. Si la consulta finaliza correctamente, responde con los usuarios obtenidos.
4. Si se produce un error, devuelve un error interno sin exponer detalles técnicos al cliente.

**Respuesta de éxito:**

```json
{
  "success": true,
  "data": []
}
```

El contenido de `data` corresponde a los registros devueltos por el repositorio. La implementación debe evitar exponer contraseñas, hashes, tokens u otros datos sensibles.

**Mejora prevista:** incorporar paginación cuando el repositorio disponga de consultas paginadas.

### 2. Actualizar el rol de un usuario

**Endpoint:** `PATCH /api/admin/usuarios/:id/rol`

**Permiso:** `ADMIN`.

**Parámetro de ruta:**

- `id`: identificador del usuario cuyo rol se quiere modificar.

**Cuerpo de la petición:**

```json
{
  "rol": "MARKETING"
}
```

El valor de ejemplo debe sustituirse por uno de los roles definidos en `ROLES_PERMITIDOS`.

**Funcionamiento:**

1. Se valida el identificador recibido en la URL.
2. Se valida el cuerpo de la petición mediante `AdminValidator`.
3. Se comprueba que el rol esté incluido en `ROLES_PERMITIDOS`.
4. Se comprueba la restricción para evitar que el administrador se quite a sí mismo el rol de administrador, siempre que el middleware exponga su identificador en la propiedad utilizada por el controlador.
5. Se solicita al repositorio la actualización del rol.
6. Si el usuario no existe, se responde con `404`.
7. Si la operación termina correctamente, se devuelve el usuario actualizado.

**Respuesta de éxito:**

```json
{
  "success": true,
  "message": "Rol de usuario actualizado exitosamente",
  "data": {}
}
```

`data` contiene el resultado devuelto por el repositorio. Debe limitarse a los campos seguros para el cliente.

### Códigos de respuesta

| Código | Significado                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------ |
| `200`  | La consulta o actualización terminó correctamente.                                                                 |
| `400`  | El identificador, el cuerpo o el rol no son válidos; también puede indicar que se intentó una operación prohibida. |
| `401`  | No hay una autenticación válida, según el comportamiento del middleware.                                           |
| `403`  | El usuario autenticado no tiene el rol requerido, según el comportamiento del middleware.                          |
| `404`  | El usuario solicitado no existe.                                                                                   |
| `500`  | Se produjo un error interno al procesar la petición.                                                               |

Los errores `401` y `403` dependen de cómo estén implementados `authMiddleware` y `requireRole`.

## Validación

El archivo `AdminValidator.ts` centraliza la validación de las peticiones administrativas.

Actualmente contempla:

- Identificador obligatorio, no vacío y con una longitud máxima.
- Cuerpo de actualización con la propiedad `rol`.
- Rol como cadena no vacía y con una longitud máxima.
- Rechazo de propiedades adicionales en el cuerpo de actualización.

Después de la validación estructural, el controlador comprueba que el rol pertenezca a `ROLES_PERMITIDOS`.

La validación del identificador debe ajustarse al formato real utilizado por el proyecto cuando este esté definido.

## Responsabilidades de los componentes

### `adminRoutes.ts`

Declara las rutas específicas del módulo. No duplica los middlewares globales porque el router principal ya protege el prefijo `/admin`.

### `AdminController.ts`

Orquesta las operaciones administrativas. Valida los datos recibidos, llama al repositorio, determina los códigos HTTP y devuelve respuestas consistentes.

No debe contener consultas de base de datos directamente ni exponer información sensible.

### `AdminValidator.ts`

Centraliza las reglas de validación de los parámetros y del cuerpo de las peticiones, separándolas de la lógica de negocio.

### `UserRepository`

Es responsable de consultar los usuarios y ejecutar los cambios de rol. Debe devolver resultados seguros para la capa HTTP y distinguir correctamente entre usuarios inexistentes y errores de ejecución.

### `ROLES_PERMITIDOS`

Define los roles que se pueden asignar. Debe mantenerse sincronizado con los roles reconocidos por el sistema de autorización.

## Pedidos locales

El controlador original incluye un método para obtener pedidos locales, pero la implementación compartida utiliza un arreglo vacío fijo y no consulta ningún repositorio.

Por ese motivo, el endpoint `GET /api/admin/pedidos-locales` no se considera implementado en esta versión de la documentación. Antes de publicarlo, debe conectarse con la consulta real y registrarse en `adminRoutes.ts`.

## Mejoras pendientes

- Incorporar paginación en el listado de usuarios.
- Auditar los cambios de roles.
- Impedir de forma atómica que se elimine el último administrador activo, si esa es una regla del sistema.
- Verificar que la protección contra cambios del propio rol utiliza correctamente la identidad proporcionada por el middleware.
- Ajustar la validación del identificador al formato real de la base de datos.
- Confirmar que las respuestas del repositorio no incluyen información sensible.
- Implementar la consulta real de pedidos locales antes de exponer su endpoint.

## Resumen

El módulo permite listar usuarios y actualizar sus roles. Ambas rutas requieren autenticación y rol `ADMIN`. La validación se realiza en el backend y los errores internos se registran sin exponer sus detalles al cliente.

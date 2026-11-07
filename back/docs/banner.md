# Módulo de Banners

**Archivo recomendado:** `docs/banners.md`

## 1. Descripción general

El módulo de banners permite consultar y administrar los banners principales de la aplicación.

Los usuarios pueden consultar los banners sin iniciar sesión. Las operaciones de creación, actualización y eliminación están restringidas a usuarios autenticados que tengan el rol `MARKETING`.

El módulo utiliza:

- **BannerController:** gestiona las peticiones HTTP y coordina las operaciones.
- **BannerRepository:** consulta, guarda, actualiza y elimina los banners de la base de datos.
- **BannerValidator:** valida los datos recibidos mediante Zod.
- **StorageService:** gestiona los archivos de imágenes almacenados en S3.

## 2. Rutas disponibles

La ruta base del módulo es `/api/banners/`.

| Método | Endpoint                      | Acceso          | Descripción                                 |
| ------ | ----------------------------- | --------------- | ------------------------------------------- |
| GET    | `/api/banners/`               | Público         | Lista todos los banners.                    |
| GET    | `/api/banners/:identificador` | Público         | Obtiene un banner específico.               |
| POST   | `/api/banners/`               | Rol `MARKETING` | Crea o actualiza un banner.                 |
| DELETE | `/api/banners/:identificador` | Rol `MARKETING` | Elimina un banner y sus imágenes asociadas. |

### Control de acceso

Las operaciones de escritura utilizan los middlewares `authMiddleware` y `requireRole("MARKETING")`.

- `authMiddleware` verifica la sesión del usuario.
- `requireRole("MARKETING")` comprueba que el usuario tenga el rol requerido.
- Las rutas `GET` no incluyen estos middlewares directamente, por lo que son públicas siempre que no exista una restricción global en el enrutador principal.

## 3. Listar todos los banners

**Método:** `GET`

**Endpoint:** `/api/banners/`

**Controlador:** `listarBanners`

Obtiene todos los banners almacenados mediante el método `obtenerTodos()` del repositorio.

### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "identificador": "home-principal",
      "titulo": "Promoción principal",
      "imagenes": [
        {
          "objectKey": "banners/imagenes/banner-principal.webp",
          "publicUrl": "https://storage.example.com/mi-tienda/banners/imagenes/banner-principal.webp"
        }
      ],
      "activo": true
    }
  ]
}
```

La estructura de cada elemento depende del modelo y de los datos devueltos por el repositorio.

### Error posible

- `500 Internal Server Error`: ocurre un error al recuperar los banners.

## 4. Obtener un banner por identificador

**Método:** `GET`

**Endpoint:** `/api/banners/:identificador`

**Controlador:** `obtenerBanner`

Recupera un banner específico utilizando el identificador recibido como parámetro de ruta.

### Ejemplo de petición

`GET /api/banners/home-principal`

### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "data": {
    "identificador": "home-principal",
    "titulo": "Promoción principal",
    "imagenes": [],
    "activo": true
  }
}
```

### Errores posibles

- `404 Not Found`: no existe un banner con el identificador solicitado.
- `500 Internal Server Error`: ocurre un error durante la consulta.

## 5. Crear o actualizar un banner

**Método:** `POST`

**Endpoint:** `/api/banners/`

**Controlador:** `guardarBanner`

**Acceso requerido:** sesión válida y rol `MARKETING`.

Este endpoint permite crear un banner nuevo o actualizar uno existente. La operación se determina mediante el campo `identificador`.

### Cuerpo de la petición

```json
{
  "identificador": "home-principal",
  "titulo": "Promoción de temporada",
  "imagenes": [
    {
      "objectKey": "banners/imagenes/promocion-temporada.webp",
      "publicUrl": "https://storage.example.com/mi-tienda/banners/imagenes/promocion-temporada.webp"
    }
  ],
  "activo": true
}
```

Los valores son ilustrativos. La estructura de cada imagen debe ajustarse al esquema definido en `BannerValidator`.

### Campos de la petición

| Campo                  | Tipo      | Descripción                                                       |
| ---------------------- | --------- | ----------------------------------------------------------------- |
| `identificador`        | `string`  | Identificador único utilizado para buscar y actualizar el banner. |
| `titulo`               | `string`  | Título descriptivo del banner.                                    |
| `imagenes`             | `array`   | Lista de imágenes asociadas al banner.                            |
| `imagenes[].objectKey` | `string`  | Clave del archivo en el almacenamiento S3.                        |
| `imagenes[].publicUrl` | `string`  | URL pública de la imagen, si se proporciona.                      |
| `activo`               | `boolean` | Indica si el banner está activo.                                  |

La validación concreta de campos, valores obligatorios y restricciones depende de `crearOActualizarBannerSchema`, definido en `BannerValidator`.

### Flujo de ejecución

1. Se valida el cuerpo de la petición mediante `BannerValidator.validateCrearOActualizarBanner()`.
2. Si la validación falla, se responde con `400 Bad Request` y los errores detectados por Zod.
3. Se busca un banner existente mediante `obtenerPorIdentificador()`.
4. Si existe, se comparan sus imágenes con las recibidas en la petición.
5. Se intenta eliminar de S3 cada imagen anterior cuyo `objectKey` ya no esté presente en la nueva lista.
6. Se crea o actualiza el banner mediante `guardarOActualizar()`.
7. Se devuelve el banner guardado.

Si no existe un banner con el identificador proporcionado, el repositorio puede crear uno nuevo. Si ya existe, puede actualizarlo.

### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "message": "Banner guardado y actualizado exitosamente",
  "data": {}
}
```

El campo `data` contiene el objeto devuelto por el repositorio.

### Errores posibles

- `400 Bad Request`: los datos enviados no cumplen el esquema de validación.
- `500 Internal Server Error`: ocurre un error durante el procesamiento o el guardado.

### Consideraciones sobre las imágenes

El controlador identifica las imágenes antiguas mediante `objectKey`. Cuando una imagen anterior no aparece en la petición nueva, intenta eliminarla de S3.

Si la eliminación de una imagen falla, el error se registra y el proceso continúa. Además, en la implementación actual, esta limpieza ocurre antes de guardar la actualización en la base de datos. Si el guardado falla posteriormente, el banner podría conservar una referencia a un archivo eliminado.

## 6. Eliminar un banner

**Método:** `DELETE`

**Endpoint:** `/api/banners/:identificador`

**Controlador:** `eliminarBanner`

**Acceso requerido:** sesión válida y rol `MARKETING`.

Elimina un banner por su identificador y trata de eliminar las imágenes asociadas del almacenamiento S3.

### Ejemplo de petición

`DELETE /api/banners/home-principal`

No requiere un cuerpo JSON; el identificador se proporciona en la URL.

### Flujo de ejecución

1. Se comprueba que el identificador esté presente.
2. Se busca el banner mediante `obtenerPorIdentificador()`.
3. Si el banner no existe, se devuelve `404 Not Found`.
4. Se recorren las imágenes asociadas al banner.
5. Para cada imagen con `objectKey`, se ejecuta `storageService.eliminarArchivo()`.
6. Si falla el borrado de una imagen, se registra el error y se continúa.
7. Se elimina el registro de la base de datos mediante `eliminarPorIdentificador()`.
8. Se devuelve una respuesta de confirmación.

### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "message": "Banner con identificador 'home-principal' eliminado exitosamente"
}
```

### Errores posibles

- `404 Not Found`: no existe un banner con el identificador indicado.
- `500 Internal Server Error`: ocurre un error durante el proceso de eliminación.

### Consideraciones sobre el borrado

El borrado de S3 y el borrado de la base de datos no constituyen una operación atómica. Si S3 falla, el registro puede eliminarse igualmente y dejar archivos huérfanos. Si falla la eliminación del registro después de borrar las imágenes, el registro podría seguir existiendo con referencias a archivos que ya no están disponibles.

## 7. Validación de datos

El controlador utiliza `BannerValidator`, ubicado en `src/utils/BannerValidator.ts`.

El método `validateCrearOActualizarBanner()` valida los datos mediante Zod y devuelve el resultado de `safeParse()`.

Si la validación falla, la API devuelve un `400 Bad Request` con una estructura similar a la siguiente:

```json
{
  "success": false,
  "message": "Datos inválidos",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "titulo": ["El título no puede estar vacío"]
    }
  }
}
```

El contenido exacto de `details` depende de los errores que devuelva Zod.

La validación del cuerpo se aplica al endpoint de creación o actualización. Los parámetros de las rutas de consulta y eliminación se comprueban directamente en el controlador.

## 8. Repositorio

El controlador utiliza los siguientes métodos de `BannerRepository`:

| Método                                    | Función                                 |
| ----------------------------------------- | --------------------------------------- |
| `obtenerTodos()`                          | Recupera todos los banners.             |
| `obtenerPorIdentificador(identificador)`  | Busca un banner por su identificador.   |
| `guardarOActualizar(banner)`              | Crea o actualiza un banner.             |
| `eliminarPorIdentificador(identificador)` | Elimina un banner por su identificador. |

El repositorio es responsable de ejecutar las operaciones de persistencia y devolver los resultados al controlador.

## 9. Almacenamiento de imágenes

El módulo utiliza `StorageService` para gestionar las imágenes mediante un servicio compatible con S3.

Las imágenes de banners utilizan la carpeta lógica:

`banners/imagenes`

El campo `objectKey` identifica cada archivo dentro del bucket. Este valor se utiliza para eliminar imágenes y debe conservarse junto con los datos del banner.

El método `eliminarArchivo(objectKey)` encapsula la operación de eliminación del archivo en S3.

## 10. Resumen de permisos y respuestas

| Operación          | Permiso     | Respuestas relevantes |
| ------------------ | ----------- | --------------------- |
| Listar banners     | Público     | `200`, `500`          |
| Consultar banner   | Público     | `200`, `404`, `500`   |
| Crear o actualizar | `MARKETING` | `200`, `400`, `500`   |
| Eliminar banner    | `MARKETING` | `200`, `404`, `500`   |

Los middlewares de autenticación y autorización pueden devolver códigos adicionales, según su implementación.

## 11. Mejoras recomendadas

- Evitar devolver mensajes internos de excepciones en `details` en entornos de producción.
- Validar que las imágenes pertenezcan a las rutas permitidas y que sus claves correspondan a objetos autorizados.
- Considerar una estrategia de reintentos para los fallos de eliminación en S3.
- Revisar el orden de actualización de la base de datos y limpieza de imágenes para reducir el riesgo de referencias rotas.
- Confirmar que el enrutador principal no aplique autenticación global a las rutas `GET` si deben ser públicas.

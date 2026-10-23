# Módulo de Banners

**Archivo:** `docs/banners.md`

## 1. Descripción general

El módulo de banners permite administrar los banners principales de la aplicación. Ofrece operaciones para listar, consultar, crear, actualizar y eliminar banners identificados mediante un identificador único.

Las imágenes se almacenan en un servicio compatible con Amazon S3 y sus metadatos se gestionan a través de `BannerRepository`.

Todas las rutas del módulo están protegidas mediante autenticación de sesión y autorización por rol `MARKETING`.

## 2. Endpoints disponibles

| Método | Endpoint                      | Descripción                           |
| ------ | ----------------------------- | ------------------------------------- |
| GET    | `/api/banners`                | Lista todos los banners.              |
| POST   | `/api/banners`                | Crea o actualiza un banner.           |
| GET    | `/api/banners/:identificador` | Consulta un banner por identificador. |
| DELETE | `/api/banners/:identificador` | Elimina un banner por identificador.  |

### Autorización

Las rutas están registradas bajo los siguientes middlewares:

- `authMiddleware`: comprueba que la petición tenga una sesión válida.
- `requireRole("MARKETING")`: restringe el acceso a usuarios con el rol requerido.

Una sesión inválida debe ser rechazada por el middleware de autenticación. Un usuario autenticado sin el rol necesario también debe ser rechazado.

Los códigos HTTP exactos dependen de la implementación de los middlewares.

## 3. Listar banners

**Método:** `GET`

**Ruta:** `/api/banners`

**Controlador:** `listarBanners`

Obtiene todos los banners almacenados.

### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "identificador": "home-principal",
      "titulo": "Promoción principal",
      "imagenes": [],
      "activo": true
    }
  ]
}
```

El contenido de cada banner depende del modelo y de los datos almacenados.

### Errores

- `500 Internal Server Error`: no fue posible recuperar los banners.

## 4. Crear o actualizar un banner

**Método:** `POST`

**Ruta:** `/api/banners`

**Controlador:** `guardarBanner`

Este endpoint permite crear un banner o actualizar uno existente. La operación se determina mediante el campo `identificador`.

### Cuerpo de la petición

```json
{
  "identificador": "home-principal",
  "titulo": "Promoción principal",
  "imagenes": [
    {
      "objectKey": "banners/imagenes/banner-123.webp",
      "publicUrl": "https://storage.example.com/mi-tienda/banners/imagenes/banner-123.webp"
    }
  ],
  "activo": true
}
```

Los valores son ilustrativos. La estructura definitiva de cada imagen debe coincidir con la interfaz utilizada por el repositorio.

### Reglas de funcionamiento

1. Se validan la presencia de `identificador` y que `imagenes` sea un arreglo.
2. Se consulta si ya existe un banner con ese identificador.
3. Si existe, se comparan las imágenes anteriores con las recibidas para detectar archivos que ya no están referenciados.
4. Se intenta eliminar del almacenamiento los archivos antiguos que correspondan.
5. Se guarda o actualiza el banner mediante `guardarOActualizar()`.

La validación actual permite enviar un arreglo vacío de imágenes. Tampoco valida explícitamente los campos `titulo` y `activo`.

### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "message": "Banner guardado y actualizado exitosamente",
  "data": {}
}
```

El objeto `data` contiene el banner devuelto por el repositorio.

### Errores

- `400 Bad Request`: falta `identificador` o `imagenes` no es un arreglo.
- `500 Internal Server Error`: ocurre un error durante el procesamiento.

## 5. Obtener un banner por identificador

**Método:** `GET`

**Ruta:** `/api/banners/:identificador`

**Controlador:** `obtenerBanner`

Recupera un único banner utilizando el identificador especificado en la URL.

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

### Errores

- `404 Not Found`: no existe un banner con el identificador indicado.
- `500 Internal Server Error`: ocurre un error al consultar el banner.

## 6. Eliminar un banner

**Método:** `DELETE`

**Ruta:** `/api/banners/:identificador`

**Controlador:** `eliminarBanner`

Elimina un banner y trata de retirar sus imágenes asociadas del almacenamiento S3.

### Flujo de ejecución

1. Comprueba que se haya proporcionado el identificador.
2. Busca el banner en el repositorio.
3. Si no existe, devuelve un error `404`.
4. Intenta eliminar los archivos asociados mediante `StorageService`.
5. Elimina el banner de la base de datos mediante `eliminarPorIdentificador()`.
6. Devuelve una respuesta de confirmación.

Los errores al eliminar archivos de S3 se registran y no impiden continuar con la eliminación del banner en la base de datos. Por tanto, puede quedar algún archivo sin eliminar si falla el almacenamiento.

### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "message": "Banner con identificador 'home-principal' eliminado exitosamente"
}
```

### Errores

- `400 Bad Request`: falta el identificador.
- `404 Not Found`: el banner no existe.
- `500 Internal Server Error`: ocurre un error durante el proceso de eliminación.

## 7. Almacenamiento de imágenes

El módulo utiliza `StorageService` para gestionar los archivos en un almacenamiento compatible con S3.

La carpeta destinada a las imágenes de banners está definida como:

`banners/imagenes`

### Generación de URL firmada

El método `generarPresignedUrl()` genera una URL firmada para permitir la carga de una imagen. Devuelve:

- `uploadUrl`: URL firmada para realizar la carga.
- `publicUrl`: URL construida para acceder al archivo.
- `objectKey`: clave del objeto dentro del bucket.

La URL firmada tiene una duración de cinco minutos.

Para borrar archivos, se recomienda encapsular la operación en un método público `eliminarArchivo(objectKey)` dentro de `StorageService`, evitando el acceso directo a sus propiedades privadas.

La eliminación de objetos debe utilizar la clave `objectKey`, no la URL pública completa.

## 8. Repositorio

El controlador utiliza los siguientes métodos de `BannerRepository`:

| Método                                    | Función                              |
| ----------------------------------------- | ------------------------------------ |
| `obtenerTodos()`                          | Recupera todos los banners.          |
| `obtenerPorIdentificador(identificador)`  | Busca un banner por identificador.   |
| `guardarOActualizar(banner)`              | Crea o actualiza un banner.          |
| `eliminarPorIdentificador(identificador)` | Elimina un banner por identificador. |

El repositorio debe implementar todos estos métodos con firmas compatibles con las llamadas del controlador.

## 9. Consideraciones de seguridad y mantenimiento

- Todas las rutas requieren autenticación y el rol `MARKETING`.
- Las URL firmadas para cargar imágenes tienen una vigencia de cinco minutos.
- Las claves de los objetos deben conservarse para poder identificar y eliminar los archivos asociados.
- Conviene validar el formato de las imágenes y los campos `titulo` y `activo`.
- Se recomienda evitar devolver detalles internos de excepciones al cliente en entornos de producción.
- Los fallos de eliminación en S3 deberían registrarse para permitir su revisión y eventual reintento.
- Si la eliminación de archivos es un requisito crítico, debe contemplarse una estrategia de reintentos o limpieza de archivos huérfanos.

## 10. Resumen

El módulo proporciona las cuatro operaciones principales para administrar banners. La autenticación y autorización se aplican desde el enrutador, mientras que el controlador coordina las operaciones del repositorio y del almacenamiento.

La eliminación de registros y la limpieza de imágenes son operaciones relacionadas, pero no atómicas: un fallo en S3 puede dejar archivos huérfanos aunque el banner se elimine correctamente de la base de datos.

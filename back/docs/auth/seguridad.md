# 🛡️ Seguridad

## Contraseñas y Autenticación

- **Hash con Bcrypt:** Las contraseñas de registro tradicional no se almacenan en texto plano. Se procesan mediante un _hash_ generado con `Bcrypt` antes de persistirse en la base de datos.

- **Autenticación con Google (OAuth 2.0):** La autenticación con Google utiliza la verificación de `id_token` mediante `google-auth-library`. El backend valida el token y comprueba que su `audience` corresponda al `GOOGLE_CLIENT_ID` configurado en el servidor.

- **Sesiones del servidor:** Una vez autenticado el usuario, el backend mantiene la sesión mediante `express-session` utilizando PostgreSQL como almacenamiento de sesiones. La información almacenada en sesión se limita a los datos necesarios para identificar y autorizar al usuario.

## Protección contra SQL Injection

- **Consultas Parametrizadas (Prepared Statements):** Toda interacción con PostgreSQL utiliza parámetros posicionales (`$1`, `$2`, etc.), manteniendo separados los datos proporcionados por el usuario de las instrucciones SQL.

- **Cero Concatenación Dinámica:** Las consultas SQL se mantienen centralizadas en `query.json`. Los datos proporcionados por los usuarios no se concatenan directamente en las sentencias SQL.

## Validación y Sanitización de Entradas

- **Validaciones de Esquema:** Las peticiones entrantes (`body`, `params` y `query`) son validadas antes de llegar a los repositorios.

- **Validación de Tipos:** Los datos recibidos se comprueban para garantizar que correspondan con los tipos esperados.

- **Restricción de Propiedades:** Se rechazan o ignoran propiedades no autorizadas para evitar que el cliente pueda modificar directamente campos que deberían ser controlados por el servidor.

- **Límite del cuerpo JSON:** El servidor limita el tamaño de las peticiones JSON a `1 MB`, reduciendo el riesgo de consumir recursos excesivos mediante cuerpos de petición demasiado grandes.

## Protección HTTP y CORS

- **Helmet:** El servidor utiliza `Helmet` para establecer cabeceras HTTP de seguridad y reducir la exposición frente a ataques comunes del navegador.

- **HSTS:** En producción se habilita `Strict-Transport-Security`, obligando a los navegadores a utilizar HTTPS durante el periodo configurado.

- **Protección contra Clickjacking:** Se utiliza `X-Frame-Options: DENY` mediante Helmet para impedir que la aplicación sea embebida en un `iframe`.

- **MIME Sniffing:** Se habilita `X-Content-Type-Options: nosniff` para evitar que los navegadores intenten interpretar los recursos con un tipo MIME diferente al declarado.

- **CORS restringido:** Las peticiones cross-origin únicamente se permiten desde los orígenes configurados por la aplicación. No se utiliza un origen comodín (`*`) junto con credenciales.

## Protección contra Abuso y Fuerza Bruta

- **Rate Limiting global:** Se utiliza `express-rate-limit` para limitar el número de peticiones que una misma dirección IP puede realizar durante un periodo determinado.

- **Rate Limiting para autenticación:** Los endpoints relacionados con autenticación cuentan con un límite más estricto para dificultar ataques de fuerza bruta contra el inicio de sesión y otros procesos de autenticación.

- **Separación de límites:** Las operaciones generales de la API y las operaciones sensibles de autenticación utilizan límites independientes.

## Manejo Seguro de Sesiones

- **Almacenamiento en PostgreSQL:** Las sesiones de `express-session` se almacenan mediante `connect-pg-simple`, evitando depender del almacenamiento en memoria del proceso de Node.js.

- **Cookie `HttpOnly`:** La cookie de sesión utiliza `HttpOnly`, evitando que JavaScript del navegador pueda acceder directamente a ella.

- **Cookie `Secure` en producción:** En producción la cookie de sesión se configura con `Secure`, por lo que únicamente puede transmitirse mediante HTTPS.

- **SameSite:** La política `SameSite` se configura de acuerdo con el entorno de ejecución para controlar el envío de cookies en solicitudes cross-site.

- **Expiración de sesión:** Las sesiones tienen una duración máxima configurada y utilizan renovación (`rolling`) para mantener activa la sesión mientras el usuario continúa interactuando con la aplicación.

- **Mínimo privilegio:** La sesión únicamente almacena la información necesaria para identificar al usuario y determinar sus permisos:

```ts
{
  (id, email, nombre, tipo);
}
```

- **No exposición del identificador de sesión:** El identificador interno de la sesión no se devuelve al cliente en las respuestas de autenticación.

- **Cierre de sesión:** Al cerrar sesión, la sesión almacenada en el servidor es destruida y la cookie correspondiente es eliminada.

## Autorización basada en Roles

- **Middleware de autenticación:** Las rutas protegidas utilizan un middleware que verifica la existencia de una sesión válida antes de permitir el acceso.

- **Control de roles:** Las rutas que requieren permisos específicos utilizan un middleware de autorización independiente (`RoleMiddleware`).

- **Roles definidos por el sistema:** La aplicación utiliza roles controlados por el backend, actualmente `CLIENTE` y `ADMIN`.

- **Rol controlado por el servidor:** Durante el registro público, el cliente no puede seleccionar libremente privilegios administrativos. El rol inicial es asignado por el servidor.

- **Defensa a nivel de base de datos:** El campo de rol utiliza un tipo restringido en PostgreSQL que únicamente permite los valores definidos por la aplicación.

## Protección de Información Sensible

- **Filtrado de respuestas:** Los endpoints que devuelven información de usuarios eliminan explícitamente campos sensibles como `password_hash` antes de enviar la respuesta al cliente.

- **No almacenamiento de contraseñas en sesión:** Las contraseñas y sus hashes nunca forman parte de la información almacenada en la sesión.

- **Variables de entorno:** Los secretos de configuración, como `SESSION_SECRET`, no se almacenan directamente en el código fuente. La aplicación requiere que `SESSION_SECRET` esté definido mediante variables de entorno.

- **Mensajes de error controlados:** Las respuestas de error destinadas al cliente utilizan mensajes generales y no exponen detalles internos de la implementación o de la base de datos.

## Almacenamiento Seguro de Archivos

- **Arquitectura mediante Presigned URLs:** Para el almacenamiento de archivos se utilizan URLs firmadas temporalmente para permitir que el cliente realice la subida directamente al almacenamiento.

- **Expiración de URLs:** Las URLs de subida tienen una duración limitada, reduciendo el periodo durante el cual pueden ser utilizadas.

- **Aislamiento de archivos binarios:** Los archivos multimedia no son procesados directamente por el servidor como grandes buffers de memoria, reduciendo el consumo de recursos del backend y el riesgo de ataques de denegación de servicio por agotamiento de memoria.

> **Nota:** La implementación de almacenamiento de archivos está siendo migrada progresivamente hacia Neon Storage. Las medidas de seguridad descritas para almacenamiento deben mantenerse al realizar dicha migración.

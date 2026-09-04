# INVENTORY_CHANGESET

Fecha de entrega: 2026-09-03

## 1. Resumen de la funcionalidad

Se incorporó una pantalla de inventario independiente, integrada con el layout y las librerías visuales existentes del frontend. Incluye:

- indicadores de total de productos, poco stock, agotados y valor estimado;
- búsqueda por nombre, SKU y categoría;
- filtros por categoría y estado;
- ordenamiento y paginación local;
- tabla de escritorio y tarjetas adaptadas a dispositivos móviles;
- estados de carga, error, inventario vacío y búsqueda sin resultados;
- formulario reutilizable para crear, consultar y editar productos;
- validaciones obligatorias, numéricas, de SKU duplicado y actualización automática del estado;
- datos mock tipados y persistencia exclusivamente en memoria.

No se agregó integración con backend, almacenamiento local ni dependencias nuevas.

## 2. Ruta local para visualizar el componente

Operación: CREAR

URL: `http://localhost:4200/inventario`

Ruta Angular: `/inventario`

La ruta utiliza el layout principal existente. No se agregó una opción al menú lateral para mantener la integración mínima solicitada.

## 3. Comandos utilizados

Los comandos relevantes utilizados durante el análisis, implementación y validación fueron:

```text
git status --short --branch
git diff -- src/app/app.routes.ts
git diff -- package.json package-lock.json angular.json tsconfig.json tsconfig.app.json src/styles.less
npx ngc -p tsconfig.app.json --noEmit
npx ngc -p tsconfig.spec.json --noEmit
npx lessc src/app/features/inventario/inventario.less NUL
npx prettier --write src/app/features/inventario/*
npx prettier --check src/app/features/inventario/*
npm run build
npm test -- --watch=false
npm start -- --host 127.0.0.1 --port 4200
rg --files src/app
rg -n "any|@ts-ignore|eslint-disable|https?://|localStorage|HttpClient|fetch" src/app/features/inventario
Get-FileHash -Algorithm SHA256
```

También se usaron `Copy-Item` y `robocopy` para crear los respaldos, las copias finales y un clon temporal de validación; `subst` se utilizó únicamente para aislar dicho clon durante el build y fue retirado al finalizar.

## 4. Comandos necesarios para ejecutar el proyecto

Desde `C:\Users\User\TuSitioImport\Frontend`:

```powershell
npm start
```

Después, abrir `http://localhost:4200/inventario`.

Validaciones disponibles:

```powershell
npm run build
npm test -- --watch=false
```

El proyecto no define un script de lint.

## 5. Archivos creados

- CREAR: `src/app/features/inventario/inventario.ts`
- CREAR: `src/app/features/inventario/inventario.html`
- CREAR: `src/app/features/inventario/inventario.less`
- CREAR: `src/app/features/inventario/inventario.spec.ts`
- CREAR: `src/app/features/inventario/inventario.models.ts`
- CREAR: `src/app/features/inventario/inventario.mock.ts`
- CREAR: `_codex-delivery/INVENTORY_CHANGESET.md`

## 6. Archivos modificados

- REEMPLAZAR: `src/app/app.routes.ts`

No se modificó ningún otro archivo existente del frontend.

## 7. Archivos respaldados

- REEMPLAZAR: `_codex-delivery/before/src/app/app.routes.ts`

El respaldo conserva el contenido original completo que existía inmediatamente antes de integrar la ruta. Su SHA-256 es:

```text
27FA9131DF53DC44F62E02C9620A3231225877C0CECC3144A4DE3D1093F23B4B
```

## 8. Motivo de cada modificación

- REEMPLAZAR: `src/app/app.routes.ts`: se añadió únicamente el import del componente `Inventario` y la ruta hija `{ path: 'inventario', component: Inventario }`. Es el cambio mínimo necesario para exponer la pantalla dentro del layout actual. Se conservaron las rutas, redirecciones y modificaciones locales preexistentes. La alternativa sin modificar este archivo sería no registrar una URL Angular navegable.
- CREAR: `inventario.ts`: contiene el estado tipado, cálculos, filtros, ordenamiento, paginación, apertura del diálogo y altas/ediciones en memoria.
- CREAR: `inventario.html`: contiene la estructura accesible y responsive de la pantalla, los estados visuales, la tabla, las tarjetas móviles y el formulario.
- CREAR: `inventario.less`: contiene solamente los estilos encapsulados del componente y sus puntos de adaptación responsive.
- CREAR: `inventario.models.ts`: define los tipos de producto, categoría, estado, filtros y ordenamiento sin utilizar `any`.
- CREAR: `inventario.mock.ts`: contiene diez productos mock tipados y claramente reemplazables por un servicio futuro.
- CREAR: `inventario.spec.ts`: cubre creación del componente, filtrado, creación, edición y estado derivado siguiendo la convención de pruebas existente.

## 9. Instrucciones para trasladar los cambios al proyecto original

1. Confirmar que el proyecto original utiliza las mismas versiones y estructura de Angular/Taiga UI/PrimeNG que esta copia.
2. Copiar desde `_codex-delivery/after/src/app/features/inventario/` los seis archivos completos a `src/app/features/inventario/` del proyecto original. Operación: CREAR.
3. Si el `src/app/app.routes.ts` original coincide con la base de esta copia, reemplazarlo por `_codex-delivery/after/src/app/app.routes.ts`. Operación: REEMPLAZAR.
4. Si el archivo de rutas original contiene cambios distintos, no reemplazarlo íntegramente: agregar el import `Inventario` y la ruta hija `inventario` exactamente como aparecen en la copia `after`, conservando el resto del archivo.
5. No copiar `node_modules`, archivos de entorno, backend ni configuraciones globales.
6. Ejecutar `npm run build` y después `npm test -- --watch=false` en el proyecto original.
7. Ejecutar `npm start` y comprobar `http://localhost:4200/inventario`.

## 10. Instrucciones para revertir los cambios

1. Reemplazar `src/app/app.routes.ts` con `_codex-delivery/before/src/app/app.routes.ts`. Operación: REEMPLAZAR.
2. Eliminar exclusivamente estos archivos creados por la entrega:
   - `src/app/features/inventario/inventario.ts`
   - `src/app/features/inventario/inventario.html`
   - `src/app/features/inventario/inventario.less`
   - `src/app/features/inventario/inventario.spec.ts`
   - `src/app/features/inventario/inventario.models.ts`
   - `src/app/features/inventario/inventario.mock.ts`
3. No eliminar ni revertir otros archivos porque no pertenecen a este cambio.

## 11. Dependencias agregadas

SIN CAMBIOS: ninguna.

- SIN CAMBIOS: `package.json`
- SIN CAMBIOS: `package-lock.json`

Se reutilizaron Angular, Taiga UI, PrimeNG y PrimeIcons ya instalados.

## 12. Problemas previos encontrados en el proyecto

- `src/app/app.routes.ts` ya tenía modificaciones locales antes de esta tarea; se preservaron íntegramente.
- `src/app/app.spec.ts` espera un encabezado de bienvenida que ya no existe en `src/app/app.html`; no se corrigió porque es una prueba antigua no relacionada.
- El build base, sin la ruta de inventario, ya supera el presupuesto inicial de 500 kB: 695.44 kB, exceso de 195.44 kB.
- La compilación LESS existente emite tres advertencias de deprecación procedentes de dependencias de Taiga UI.
- No existe un script `lint` en `package.json`.
- Existían cambios ajenos en `back/.env.example` y `back/package-lock.json`; no se tocaron.

## 13. Problemas causados por la implementación

La primera versión del estilo encapsulado superaba el presupuesto de 4 kB por componente. El LESS fue compactado sin retirar comportamiento ni adaptaciones responsive; la compilación final ya no emite esa advertencia.

No quedaron errores TypeScript, de template o LESS atribuibles a la implementación.

## 14. Resultado de la compilación

Comando: `npm run build`

Resultado sobre una copia física exacta del frontend y de `node_modules`: CORRECTO.

```text
Application bundle generation complete.
Initial total: 822.21 kB
Estimated transfer size: 177.90 kB
```

Permanece una advertencia global de presupuesto: el bundle inicial excede 500 kB por 322.21 kB. El proyecto base ya presentaba esta advertencia; la ruta eager de inventario incrementa el bundle inicial aproximadamente 126.77 kB, en concordancia con la arquitectura de rutas existente.

El mismo comando ejecutado directamente en la ubicación original bajo el entorno aislado de Codex no llegó a compilar y devolvió errores `Access is denied` al inspeccionar directorios superiores y resolver archivos existentes como `main.ts` y `styles.less`. Se clasificó como una limitación del sandbox, no como un error del código. Por ello se validó una copia física byte a byte en un directorio permitido. La recomendación es repetir `npm run build` directamente en una terminal normal del proyecto.

## 15. Resultado del lint

SIN CAMBIOS: no existe un script de lint configurado, por lo que no se ejecutó uno.

Como comprobaciones equivalentes de formato y tipado:

- `npx prettier --check src/app/features/inventario/*`: CORRECTO.
- `npx ngc -p tsconfig.app.json --noEmit`: CORRECTO.
- búsqueda de `any`, `@ts-ignore` y `eslint-disable`: sin coincidencias.

## 16. Resultado de las pruebas

Comando: `npm test -- --watch=false`

Resultado del runner: NO VERIFICABLE en este entorno. En la unidad virtual usada para evitar la restricción del sandbox, Vitest no pudo resolver su propio módulo mediante la ruta virtual (`Cannot find module 'W:\\@id\\W:\\node_modules\\vitest\\dist\\index.js'`); en la ruta física, el empaquetador volvió a quedar bloqueado por `Access is denied`. No se ejecutó ninguna suite, por lo que no se afirma que las pruebas automatizadas hayan pasado.

Comprobaciones adicionales:

- `npx ngc -p tsconfig.spec.json --noEmit`: CORRECTO; las pruebas y templates compilan.
- Prueba visual y funcional en navegador local: CORRECTA.
- Se verificaron búsqueda, ausencia de resultados, filtros combinados, ordenamiento, paginación, alta, validaciones obligatorias y de SKU duplicado, edición, recálculo de indicadores, vista de solo lectura y adaptación a 390 px.
- Consola del navegador durante las pruebas: sin errores ni advertencias.

La prueba preexistente desactualizada de `app.spec.ts` continúa fuera del alcance y podría fallar cuando el runner pueda ejecutarse normalmente.

## 17. Advertencias restantes

- Advertencia preexistente de presupuesto global del bundle, ahora incrementada por la nueva ruta eager.
- El menú conserva su estado actual y no incluye un enlace a Inventario; la pantalla se abre directamente mediante `/inventario`, según la estrategia de integración mínima aprobada.
- Los datos son locales y se pierden al recargar la página, de forma intencional.
- No se validó el runner de pruebas de extremo a extremo por la limitación ambiental descrita.

## Inventario completo de operaciones

- CREAR: `src/app/features/inventario/inventario.ts`
- CREAR: `src/app/features/inventario/inventario.html`
- CREAR: `src/app/features/inventario/inventario.less`
- CREAR: `src/app/features/inventario/inventario.spec.ts`
- CREAR: `src/app/features/inventario/inventario.models.ts`
- CREAR: `src/app/features/inventario/inventario.mock.ts`
- REEMPLAZAR: `src/app/app.routes.ts`
- SIN CAMBIOS: autenticación
- SIN CAMBIOS: guards e interceptores
- SIN CAMBIOS: servicios y componentes no relacionados
- SIN CAMBIOS: `package.json`
- SIN CAMBIOS: `package-lock.json`
- SIN CAMBIOS: `angular.json`
- SIN CAMBIOS: `tsconfig.json`
- SIN CAMBIOS: `tsconfig.app.json`
- SIN CAMBIOS: `src/styles.less`
- SIN CAMBIOS: backend, endpoints y variables de entorno

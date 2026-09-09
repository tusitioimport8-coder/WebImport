# 🎫 Sesiones

## `checkSession()`

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

# Rutas principales

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

## Resumen

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/login` | Inicia sesión |
| `POST` | `/register` | Registra un usuario |
| `POST` | `/logout` | Cierra la sesión |

## Flujo general

```text
Cliente
│
├── POST /register
│   ├── Validar datos
│   ├── Validar correo
│   ├── Validar contraseña
│   ├── Verificar usuario existente
│   ├── Hashear contraseña
│   └── Crear usuario
│
├── POST /login
│   ├── Validar correo
│   ├── Buscar usuario
│   ├── Comparar contraseña
│   └── Crear sesión
│
└── POST /logout
    └── Destruir sesión
```

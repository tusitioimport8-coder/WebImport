import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import helmet from "helmet"; // 1. Importar Helmet
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// ==========================================
// CONFIGURACIÓN DE PROXY (Crucial para producción)
// ==========================================
// Permite que Express reconozca cabeceras X-Forwarded-* de Render/Railway/Nginx
// y aplique correctamente 'secure: true' y 'sameSite: none' en las cookies.
if (isProduction) {
  app.set("trust proxy", 1);
}

// ==========================================
// CABECERAS DE SEGURIDAD (Helmet)
// ==========================================
app.use(
  helmet({
    // HSTS: Fuerza HTTPS en producción durante 1 año (incluyendo subdominios)
    strictTransportSecurity: isProduction
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,

    // Previene ataques de Clickjacking impidiendo que tu API se monte en <iframe>
    frameguard: {
      action: "deny",
    },

    // Evita el Sniffing de tipos MIME (X-Content-Type-Options: nosniff)
    noSniff: true,

    // Permite que el frontend (ej. Angular) cargue imágenes o recursos desde /uploads
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// ==========================================
// 1. LIMITADOR GENERAL (Para toda la API)
// Permite 100 peticiones cada 15 minutos por IP
// ==========================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Máximo 100 peticiones por ventana de tiempo
  standardHeaders: true, // Retorna la info en los headers 'RateLimit-*'
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Demasiadas peticiones desde esta IP. Inténtalo de nuevo en 15 minutos.",
  },
});

// Aplicar el limitador general a todas las rutas
app.use(apiLimiter);

// ==========================================
// 2. LIMITADOR ESTRICTO (Para Autenticación)
// Evita ataques de fuerza bruta en Login / Auth
// Permite 10 intentos cada 15 minutos por IP
// ==========================================
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Demasiados intentos de inicio de sesión. Por favor espera 15 minutos.",
  },
});

// ==========================================
// CORS GLOBAL
// ==========================================
const allowedOrigins = [
  "http://localhost:4200",
  "http://127.0.0.1:4200",
  "https://localhost",
  "capacitor://localhost",
];

// Si tienes un dominio de producción en .env, se añade a la lista
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/uploads", express.static(path.resolve("uploads")));

// JSON
app.use(express.json({ limit: "1mb" }));

// ==========================================
// SESIÓN: store PostgreSQL (connect-pg-simple)
// ==========================================
const PgStore = connectPgSimple(session);

const sessionPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  user: !process.env.DATABASE_URL ? process.env.DB_USER : undefined,
  host: !process.env.DATABASE_URL ? process.env.DB_HOST : undefined,
  database: !process.env.DATABASE_URL ? process.env.DB_DATABASE : undefined,
  password: !process.env.DATABASE_URL ? process.env.DB_PASSWORD : undefined,
  port:
    !process.env.DATABASE_URL && process.env.DB_PORT
      ? parseInt(process.env.DB_PORT, 10)
      : undefined,
});

const TWO_HOURS_MS = 1000 * 60 * 60 * 2;

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET no está configurado");
}

app.use(
  session({
    store: new PgStore({
      pool: sessionPool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: TWO_HOURS_MS,
    },
  }),
);

export default app;

import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// --- CORS global ---

app.use(
  cors({
    origin: [
      "http://localhost:4200",
      "http://127.0.0.1:4200",
      "https://localhost",
      "capacitor://localhost",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/uploads", express.static(path.resolve("src/uploads")));

// JSON
app.use(express.json());

// ==========================================
// SESIÓN: store PostgreSQL (connect-pg-simple)
// Duración: 2 horas
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

app.use(
  session({
    store: new PgStore({
      pool: sessionPool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "mi-clave-secreta",
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    rolling: true,
    cookie: {
      httpOnly: true,
      // Si el front y back están en dominios o servicios distintos (ej: Vercel + Render):
      secure: isProduction, // Requiere HTTPS en producción
      sameSite: isProduction ? "none" : "lax", // 'none' permite cookies entre diferentes dominios
      maxAge: TWO_HOURS_MS,
    },
  }),
);

export default app;

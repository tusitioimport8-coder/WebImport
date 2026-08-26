import pg from "pg";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const { Pool } = pg;

// Interfaz para la estructura de cada consulta en el query.json
interface QueryConfig {
  query: string;
  orderArray: string[];
}

// Interfaz para el diccionario completo del JSON
interface QueriesMap {
  [key: string]: QueryConfig;
}

export default class DB {
  // Propiedades de la clase declaradas con sus tipos
  private pool: pg.Pool | null;
  private queries: QueriesMap;

  constructor() {
    this.pool = null;
    this.queries = {};
    this.init();
  }

  async init(): Promise<void> {
    try {
      const isProduction = process.env.NODE_ENV === "production";

      this.pool = new Pool({
        // Si hay DATABASE_URL usa esa, si no, cae en los parámetros sueltos (local)
        connectionString: process.env.DATABASE_URL,
        user: !process.env.DATABASE_URL ? process.env.DB_USER : undefined,
        host: !process.env.DATABASE_URL ? process.env.DB_HOST : undefined,
        database: !process.env.DATABASE_URL
          ? process.env.DB_DATABASE
          : undefined,
        password: !process.env.DATABASE_URL
          ? process.env.DB_PASSWORD
          : undefined,
        port:
          !process.env.DATABASE_URL && process.env.DB_PORT
            ? parseInt(process.env.DB_PORT, 10)
            : undefined,

        max: process.env.DB_MAX ? parseInt(process.env.DB_MAX, 10) : 20,
        idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT
          ? parseInt(process.env.DB_IDLE_TIMEOUT, 10)
          : 30000,
        connectionTimeoutMillis: process.env.DB_CONN_TIMEOUT
          ? parseInt(process.env.DB_CONN_TIMEOUT, 10)
          : 2000,

        // CRUCIAL PARA PRODUCCIÓN:
        ssl: isProduction
          ? { rejectUnauthorized: false } // Requerido por la mayoría de proveedores Cloud
          : false,
      });

      const client = await this.pool.connect();
      console.log("Base de datos inicializada correctamente");
      console.log(
        `Conexión exitosa a PostgreSQL (${isProduction ? "Producción" : "Local"})`,
      );
      client.release();
    } catch (error) {
      console.error("Error al inicializar la base de datos:", error);
    }
    await this.loadQueries();
  }

  async loadQueries(): Promise<void> {
    try {
      const queryFilePath = path.resolve(process.cwd(), "src/data/query.json");
      const data = fs.readFileSync(queryFilePath, "utf8");
      this.queries = JSON.parse(data) as QueriesMap;
    } catch (error) {
      console.error("Error al cargar query.json:", error);
    }
  }

  async executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
    if (!this.pool) {
      throw new Error("El pool de conexiones no está inicializado.");
    }
    const result = await this.pool.query(query, params);
    return result.rows as T[];
  }

  async excecuteNameQuery<T = any>(
    nameQuery: string,
    params: Record<string, any> = {},
  ): Promise<T[] | undefined> {
    try {
      await this.loadQueries();
      const queryConfig = this.queries[nameQuery];

      // Validar si existía la query
      if (!queryConfig) {
        throw new Error(`La consulta "${nameQuery}" no existe en query.json`);
      }

      console.log("Query encontrada:", queryConfig);

      const query = queryConfig.query;
      const values = queryConfig.orderArray.map((key) => params[key]);

      console.log("VALUES:", values);

      if (!this.pool) {
        throw new Error("El pool de conexiones no está inicializado.");
      }

      const result = await this.pool.query(query, values);
      return result.rows as T[];
    } catch (error) {
      console.error("Error detallado:", error);
      throw error; // Es recomendable relanzar el error para manejarlo en capas superiores
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log("Conexión a BD cerrada");
    }
  }
}

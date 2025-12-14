import * as schema from "@/db/schema";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

const globalForDb = globalThis as unknown as {
  db?: NodePgDatabase<typeof schema>;
  pool?: Pool;
};

let _db: NodePgDatabase<typeof schema> | undefined;
let _pool: Pool | undefined;

function getDb() {
  if (_db) return _db;

  // 1. Lê a variável de ambiente (Segurança ✅)
  let connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL env variable is not set");
  }

  // 2. LIMPEZA CRÍTICA: Remove parâmetros da URL (como ?sslmode=require)
  // Isso impede que o driver force validação estrita de SSL
  if (connectionString.includes("?")) {
    connectionString = connectionString.split("?")[0];
  }

  // 3. Configuração que aceita o certificado do Supabase
  const poolConfig: PoolConfig = {
    connectionString: connectionString, 
    ssl: {
      rejectUnauthorized: false, // Aceita o certificado "auto-assinado" do Supabase
    },
    max: 10,
    connectionTimeoutMillis: 10000,
  };

  _pool = globalForDb.pool ?? new Pool(poolConfig);
  _db = globalForDb.db ?? drizzle(_pool, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.pool = _pool;
    globalForDb.db = _db;
  }

  return _db;
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_, prop) {
    return Reflect.get(getDb(), prop);
  },
});

export { schema };
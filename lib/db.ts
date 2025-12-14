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

  // 1. Pega a URL do ambiente ou usa o fallback
  let connectionString = 
    process.env.DATABASE_URL || 
    "postgresql://postgres.uoagfjzsqwyobuduzkco:Livia-Financas2025@aws-1-us-east-2.pooler.supabase.com:6543/postgres";

  // 2. LIMPEZA CRÍTICA: Remove parâmetros da URL (como ?sslmode=require)
  // Isso garante que o driver obedeça nossa configuração manual de SSL abaixo
  if (connectionString.includes("?")) {
    connectionString = connectionString.split("?")[0];
  }

  // 3. Configuração explícita
  const poolConfig: PoolConfig = {
    connectionString,
    ssl: {
      rejectUnauthorized: false,
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
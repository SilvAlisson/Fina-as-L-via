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

  const { DATABASE_URL, NODE_ENV } = process.env;

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL env variable is not set");
  }

  // Configuração robusta para Vercel + Supabase
  const poolConfig: PoolConfig = {
    connectionString: DATABASE_URL,
  };

  // Se estiver em produção (Vercel), força o SSL
  if (NODE_ENV === "production") {
    poolConfig.ssl = {
      rejectUnauthorized: false,
    };
    poolConfig.max = 10;
    poolConfig.connectionTimeoutMillis = 10000;
  }

  _pool = globalForDb.pool ?? new Pool(poolConfig);
  _db = globalForDb.db ?? drizzle(_pool, { schema });

  if (NODE_ENV !== "production") {
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
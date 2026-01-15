import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("[DB] Initializing pool with DATABASE_URL...");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 10,
  min: 2,
  query_timeout: 15000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Pool error:', err);
});

pool.on('connect', () => {
  console.log('[DB] New client connected to pool');
});

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function checkDatabaseConnection(retries = 3, delayMs = 1500): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[DB] Health check attempt ${attempt}/${retries}...`);
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log(`[DB] Health check passed on attempt ${attempt}`);
      return true;
    } catch (error: any) {
      console.error(`[DB] Health check attempt ${attempt} failed:`, error.message);
      if (attempt < retries) {
        console.log(`[DB] Waiting ${delayMs}ms before retry...`);
        await sleep(delayMs);
      }
    }
  }
  console.error('[DB] All health check attempts failed');
  return false;
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DB] ${operationName} - attempt ${attempt}/${maxRetries}`);
      const result = await operation();
      console.log(`[DB] ${operationName} - success on attempt ${attempt}`);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`[DB] ${operationName} - attempt ${attempt} failed:`, error.message);
      
      const isConnectionError = 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'EAI_AGAIN' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('connection') ||
        error.message?.includes('timeout');
      
      if (isConnectionError && attempt < maxRetries) {
        console.log(`[DB] Connection error detected, waiting ${delayMs}ms before retry...`);
        await sleep(delayMs);
      } else if (!isConnectionError) {
        throw error;
      }
    }
  }
  
  console.error(`[DB] ${operationName} - all ${maxRetries} attempts failed`);
  throw lastError;
}

export const db = drizzle(pool, { schema });
export { pool };

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
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000,
  max: 10,
  min: 1,
  query_timeout: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
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

export async function checkDatabaseConnection(retries = 5, delayMs = 2000): Promise<boolean> {
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
        const waitTime = delayMs * attempt;
        console.log(`[DB] Waiting ${waitTime}ms before retry (exponential backoff)...`);
        await sleep(waitTime);
      }
    }
  }
  console.error('[DB] All health check attempts failed');
  return false;
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries = 5,
  delayMs = 2000
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
        error.code === 'ECONNRESET' ||
        error.message?.includes('connection') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Connection terminated');
      
      if (isConnectionError && attempt < maxRetries) {
        const waitTime = delayMs * attempt;
        console.log(`[DB] Connection error detected, waiting ${waitTime}ms before retry (exponential backoff)...`);
        await sleep(waitTime);
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

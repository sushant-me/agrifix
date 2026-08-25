import pg from 'pg';
import { env } from '../config/env.js';

// Use DATABASE_URL if available, otherwise fall back to individual parameters
const poolConfig = env.DATABASE_URL 
  ? { 
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASS,
      ssl: env.DB_SSLMODE === 'disable' ? false : { 
        rejectUnauthorized: false,
        // Use node's built-in certificate verification with relaxed settings
        // This is needed for Supabase's SSL certificates
      },
      family: 4,
    };

const pool = new pg.Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[db] idle client error', err.message);
});

/** Run a callback inside a transaction. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export { pool };

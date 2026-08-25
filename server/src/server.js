import app from './app.js';
import { pool } from './db/pool.js';
import { env } from './config/env.js';

const port = env.PORT;

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log(`[db] connected (${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME})`);
  } catch (err) {
    const detail = err.driverError?.message || err.message || '(no error message)';
    console.error('[db] connection failed:', detail);
    if (err.code) console.error(`[db] pg error code: ${err.code}`);
    console.error('      Check your Render/`.env` DB_* values (Supabase connection string).');
    console.error(`      Target: ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME} user=${env.DB_USER} ssl=${env.DB_SSLMODE}`);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`[server] AgriSmart API listening on http://localhost:${port}`);
    console.log(`[server] environment: ${env.NODE_ENV}`);
  });
}

start();

process.on('SIGTERM', () => {
  pool.end().finally(() => process.exit(0));
});
process.on('SIGINT', () => {
  pool.end().finally(() => process.exit(0));
});
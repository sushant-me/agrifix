import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { csrfProtection } from './middleware/csrf.js';
import { optionalAuth } from './middleware/auth.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import { UPLOAD_ROOT } from './middleware/upload.js';
import { isDev } from './config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

/* ----------------------------------------------------------- basic setup */

app.set('trust proxy', 1);

const corsOrigins = (process.env.CORS_ALLOWED_ORIGINS || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Attach req.user from the JWT cookie for every request (no-op when absent).
app.use((req, res, next) => optionalAuth(req, res, next));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT || 300),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// CSRF double-submit protection for the whole API.
app.use('/api', csrfProtection);

/* ---------------------------------------------------------------- static */

app.use('/uploads', express.static(UPLOAD_ROOT, { maxAge: isDev() ? 0 : '7d' }));

/* ------------------------------------------------------------------ routes */

app.use('/api', routes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'agrismart-server' } });
});

/* -------------------------------------------------- production: client SPA */

const clientDist = path.resolve(__dirname, '../../client/dist');
if ((process.env.SERVE_CLIENT || 'true') === 'true' && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

/* ---------------------------------------------------------------- errors */

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
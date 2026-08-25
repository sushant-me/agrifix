import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the repository-root .env first (shared), then server/.env (overrides).
// __dirname = server/src/config → ../../../ is the repo root, ../../ is server/.
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

export const env = {
  NODE_ENV: process.env.NODE_ENV || process.env.APP_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:5173',
  PORT: parseInt(process.env.PORT || '4000', 10),
  CLIENT_URL: process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:5173',

  // Database (PostgreSQL / Supabase) - support both connection string and individual params
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'postgres',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASS: process.env.DB_PASS || '',
  DB_SSLMODE: process.env.DB_SSLMODE || 'require',

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || process.env.ENCRYPTION_KEY || 'agrismart-dev-secret-change-me',
  JWT_EXPIRES_IN: parseInt(process.env.SESSION_LIFETIME || '43200', 10), // seconds

  // Khalti ePayment
  KHALTI_SECRET_KEY: process.env.KHALTI_SECRET_KEY || '',
  KHALTI_BASE_URL: process.env.KHALTI_BASE_URL || 'https://dev.khalti.com/api/v2',

  // Email (nodemailer SMTP)
  MAIL_HOST: process.env.MAIL_HOST || '',
  MAIL_PORT: parseInt(process.env.MAIL_PORT || '587', 10),
  MAIL_USERNAME: process.env.MAIL_USERNAME || '',
  MAIL_PASSWORD: process.env.MAIL_PASSWORD || '',
  MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS || 'noreply@agrismart.local',
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'AgriSmart',

  // Weather
  WEATHER_API_KEY: process.env.WEATHER_API_KEY || '',

  // Cloudinary media
  CLOUDINARY_URL: process.env.CLOUDINARY_URL || '',
  CLOUDINARY_API_KEY: process.env.CLOUDNARY_API_KEY || process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDNARY_API_SECRET || process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDNARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '',

  // Hugging Face Inference API (fallback provider)
  HUGGING_FACE_TOKEN: process.env.HUGGING_FACE_TOKEN || '',
  HUGGING_TEXT_MODEL: process.env.HUGGING_TEXT_MODEL || 'meta-llama/Llama-3.3-70B-Instruct',
  PLANT_DISEASE_MODEL: process.env.PLANT_DISEASE_MODEL || 'linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification',
  HUGGING_TIMEOUT: parseInt(process.env.HUGGING_TIMEOUT || '90000', 10),
  // Ollama is opt-in. A hosted service cannot reach an Ollama instance running
  // on a developer's machine, so do not default to localhost in production.
  OLLAMA_URL: process.env.OLLAMA_URL || '',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.2',
  OLLAMA_TIMEOUT: parseInt(process.env.OLLAMA_TIMEOUT || '60000', 10),

  // DeepSeek (OpenAI-compatible; used first when DEEPSEEK_API_KEY is set)
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',

  // Optional local Python service for artifacts produced by server/ml/train.py.
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || '',
  ML_SERVICE_TIMEOUT: parseInt(process.env.ML_SERVICE_TIMEOUT || '2500', 10),
};

export const isDev = () => env.NODE_ENV === 'development';
export const isProd = () => env.NODE_ENV === 'production';

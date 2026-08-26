const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de .env.test con prioridad para el entorno de pruebas
const envTestPath = path.resolve(__dirname, '..', '.env.test');
dotenv.config({ path: envTestPath, override: true });

process.env.NODE_ENV = 'test';

if (!process.env.DATABASE_URL) {
  const user = encodeURIComponent(process.env.DB_USER || 'root');
  const pass = process.env.DB_PASSWORD ? `:${encodeURIComponent(process.env.DB_PASSWORD)}` : '';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '3308';
  const name = process.env.DB_NAME || 'mercapleno_test';
  process.env.DATABASE_URL = `mysql://${user}${pass}@${host}:${port}/${name}`;
}

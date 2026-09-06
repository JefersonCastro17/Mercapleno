import * as dotenv from 'dotenv';
import { resolve } from 'node:path';

const envPath = resolve(__dirname, '../../.env.test');
const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
  throw new Error(`No se pudo cargar ${envPath}: ${result.error.message}`);
}

if (process.env.DB_NAME !== 'mercapleno_testv1') {
  throw new Error(`Las pruebas reales requieren DB_NAME=mercapleno_testv1; se recibio: ${process.env.DB_NAME || '(vacio)'}`);
}

if (!process.env.DATABASE_URL?.includes('/mercapleno_testv1')) {
  throw new Error('DATABASE_URL no apunta a mercapleno_testv1');
}

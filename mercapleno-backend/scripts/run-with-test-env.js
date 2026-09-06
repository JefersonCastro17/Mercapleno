const { spawnSync } = require('node:child_process');
const path = require('node:path');
const dotenv = require('dotenv');

const testEnvPath = path.resolve(__dirname, '..', '.env.test');
const result = dotenv.config({ path: testEnvPath });

if (result.error) {
  console.error(`No se pudo cargar ${testEnvPath}: ${result.error.message}`);
  process.exit(1);
}

Object.assign(process.env, result.parsed);

const databaseUrl = process.env.DATABASE_URL || '';
const databaseName = databaseUrl.split('/').pop()?.split('?')[0] || '';

if (!databaseName.endsWith('_test')) {
  console.error(`Ejecucion cancelada: DATABASE_URL no apunta a una BD *_test (${databaseName || 'vacia'}).`);
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('Uso: node scripts/run-with-test-env.js <comando> [args]');
  process.exit(1);
}

const executable = process.platform === 'win32'
  ? path.resolve(__dirname, '..', 'node_modules', '.bin', `${command}.cmd`)
  : path.resolve(__dirname, '..', 'node_modules', '.bin', command);

const child = spawnSync(executable, args, {
  cwd: path.resolve(__dirname, '..'),
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (child.error) {
  console.error(`No se pudo ejecutar ${command}: ${child.error.message}`);
  process.exit(1);
}

process.exit(child.status ?? 1);

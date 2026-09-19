const { execSync } = require('child_process');

console.log('🚀 [Docker Entrypoint] Iniciando inicialización de base de datos...');

try {
  console.log('📦 [Docker Entrypoint] Sincronizando esquema de base de datos (prisma db push)...');
  execSync('npx prisma db push --schema prisma/schema.prisma --accept-data-loss', { stdio: 'inherit' });
  
  console.log('🌱 [Docker Entrypoint] Ejecutando seed base (roles, usuarios, admin)...');
  execSync('node scripts/seed-base-system.js', { stdio: 'inherit' });

  console.log('🛒 [Docker Entrypoint] Ejecutando seed de catálogo de productos...');
  execSync('node scripts/seed-catalog-products.js', { stdio: 'inherit' });

  console.log('✅ [Docker Entrypoint] Base de datos inicializada correctamente.');
} catch (error) {
  console.warn('⚠️ [Docker Entrypoint] Advertencia durante la inicialización de DB (continuando ejecución):', error.message);
}

console.log('🌐 [Docker Entrypoint] Iniciando servidor NestJS en producción...');
require('../dist/main.js');


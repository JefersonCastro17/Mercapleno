const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'test.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

function initSqliteDatabase() {
  const db = new DatabaseSync(DB_PATH);

  // 1. Ejecutar esquema DDL
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schemaSql);

  // 2. Ejecutar datos semilla DML
  const seedSql = fs.readFileSync(SEED_PATH, 'utf-8');
  db.exec(seedSql);

  return db;
}

function resetSqliteDatabase() {
  if (fs.existsSync(DB_PATH)) {
    try {
      fs.unlinkSync(DB_PATH);
    } catch (e) {
      // Ignorar si está bloqueado temporalmente
    }
  }
  return initSqliteDatabase();
}

module.exports = {
  DB_PATH,
  SCHEMA_PATH,
  SEED_PATH,
  initSqliteDatabase,
  resetSqliteDatabase,
};

if (require.main === module) {
  initSqliteDatabase();
  console.log('✅ Base de datos SQLite inicializada exitosamente desde schema.sql y seed.sql en:', DB_PATH);
}

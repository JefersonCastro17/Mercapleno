const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv/config');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const localFile = path.join(__dirname, 'data', 'usuarios-originales.sql');
    const downloadsFile = 'C:\\Users\\jefer\\Downloads\\usuarios (2).sql';
    const filePath = fs.existsSync(localFile) ? localFile : downloadsFile;

    const rawSql = fs.readFileSync(filePath, 'utf8');
    const lines = rawSql.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Clear dummy user
    await pool.query('DELETE FROM usuarios');
    
    for (const line of lines) {
      const cleanLine = line.replace(/overriding system value/gi, '');
      await pool.query(cleanLine);
    }
    
    await pool.query("SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios))");
    
    const count = await pool.query('SELECT count(*) FROM usuarios');
    const sample = await pool.query('SELECT id, nombre, apellido, email, id_rol FROM usuarios ORDER BY id');
    console.log('Successfully inserted users count:', count.rows[0].count);
    console.table(sample.rows);
  } catch (err) {
    console.error('Error importing users:', err);
  } finally {
    await pool.end();
  }
}
run();

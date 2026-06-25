import mysql from 'mysql2/promise'

let pool

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'dealer_cohort_db',
      waitForConnections: true,
      connectionLimit: 5,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    })
  }
  return pool
}

let tableReady = false

async function ensureTable() {
  if (tableReady) return
  await getPool().execute(`
    CREATE TABLE IF NOT EXISTS cohorts (
      id          BIGINT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      segment_id  BIGINT NOT NULL,
      cohort_key  VARCHAR(255) NOT NULL UNIQUE,
      status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      last_synced_at DATETIME,
      created_at  DATETIME NOT NULL,
      updated_at  DATETIME NOT NULL
    )
  `)
  tableReady = true
}

export async function query(sql, params = []) {
  await ensureTable()
  const [rows] = await getPool().execute(sql, params)
  return rows
}

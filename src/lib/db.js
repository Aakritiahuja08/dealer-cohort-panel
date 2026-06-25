import { neon } from '@neondatabase/serverless'

let sql
function getSQL() {
  if (!sql) sql = neon(process.env.DATABASE_URL)
  return sql
}

let tableReady = false
async function ensureTable() {
  if (tableReady) return
  const db = getSQL()
  await db`
    CREATE TABLE IF NOT EXISTS cohorts (
      id             BIGSERIAL PRIMARY KEY,
      name           VARCHAR(255) NOT NULL UNIQUE,
      description    TEXT,
      segment_id     BIGINT NOT NULL,
      cohort_key     VARCHAR(255) NOT NULL UNIQUE,
      status         VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
      last_synced_at TIMESTAMP,
      created_at     TIMESTAMP NOT NULL,
      updated_at     TIMESTAMP NOT NULL
    )
  `
  tableReady = true
}

export async function query(sqlStr, params = []) {
  await ensureTable()
  const db = getSQL()
  // Convert ? placeholders to $1, $2, ... for Postgres
  let i = 0
  const pgSQL = sqlStr.replace(/\?/g, () => `$${++i}`)
  return db(pgSQL, params)
}

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

let tableReady = false
async function ensureTable() {
  if (tableReady) return
  await sql`
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

// Converts ? placeholders to $1, $2, ... for Postgres
function toPg(queryStr) {
  let i = 0
  return queryStr.replace(/\?/g, () => `$${++i}`)
}

export async function query(queryStr, params = []) {
  await ensureTable()
  return sql(toPg(queryStr), params)
}

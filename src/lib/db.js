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
      cohort_key     VARCHAR(255) NOT NULL UNIQUE,
      status         VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
      last_synced_at TIMESTAMP,
      created_at     TIMESTAMP NOT NULL,
      updated_at     TIMESTAMP NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS cohort_dealers (
      cohort_id   BIGINT NOT NULL,
      dealer_code VARCHAR(255) NOT NULL,
      PRIMARY KEY (cohort_id, dealer_code)
    )
  `
  tableReady = true
}

function toPg(queryStr) {
  let i = 0
  return queryStr.replace(/\?/g, () => `$${++i}`)
}

export async function query(queryStr, params = []) {
  await ensureTable()
  return sql.query(toPg(queryStr), params)
}

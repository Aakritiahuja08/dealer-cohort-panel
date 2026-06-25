import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { assignCohort } from '@/lib/clevertap'

export async function GET() {
  const cohorts = await query('SELECT * FROM cohorts ORDER BY created_at DESC')
  const withCounts = await Promise.all(cohorts.map(async c => {
    const [{ count }] = await query('SELECT COUNT(*) as count FROM cohort_dealers WHERE cohort_id = ?', [c.id])
    return { ...c, dealerCount: Number(count) }
  }))
  return NextResponse.json(withCounts)
}

export async function POST(req) {
  const { name, description, cohortKey, dealerCodes = [] } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const key = (cohortKey?.trim() || name.trim()).toLowerCase().replace(/\s+/g, '_')

  const existing = await query('SELECT id FROM cohorts WHERE name = ? OR cohort_key = ?', [name, key])
  if (existing.length) return NextResponse.json({ error: 'Name or cohort key already exists' }, { status: 400 })

  // Overlap check — dealer must not be in another cohort
  if (dealerCodes.length) {
    const placeholders = dealerCodes.map(() => '?').join(',')
    const conflicts = await query(
      `SELECT dealer_code FROM cohort_dealers WHERE dealer_code IN (${placeholders})`,
      dealerCodes
    )
    if (conflicts.length) {
      const codes = conflicts.map(r => r.dealer_code).join(', ')
      return NextResponse.json({ error: `Dealers already in another cohort: ${codes}` }, { status: 400 })
    }
  }

  const now = new Date().toISOString()
  const syncedAt = dealerCodes.length ? now : null

  const result = await query(
    `INSERT INTO cohorts (name, description, cohort_key, status, last_synced_at, created_at, updated_at)
     VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?) RETURNING id`,
    [name, description || null, key, syncedAt, now, now]
  )
  const cohortId = result[0].id

  if (dealerCodes.length) {
    for (const code of dealerCodes) {
      await query('INSERT INTO cohort_dealers (cohort_id, dealer_code) VALUES (?, ?)', [cohortId, code])
    }
    await assignCohort(dealerCodes, key)
  }

  const [cohort] = await query('SELECT * FROM cohorts WHERE id = ?', [cohortId])
  return NextResponse.json({ ...cohort, dealerCount: dealerCodes.length }, { status: 201 })
}

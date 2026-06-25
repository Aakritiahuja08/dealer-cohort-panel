import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createSegment, addDealers, getDealerCount } from '@/lib/segmentation'
import { assignCohort } from '@/lib/clevertap'

export async function GET() {
  try {
    const cohorts = await query('SELECT * FROM cohorts ORDER BY created_at DESC')
    const withCounts = await Promise.all(
      cohorts.map(async c => ({ ...c, dealerCount: await getDealerCount(c.segment_id) }))
    )
    return NextResponse.json(withCounts)
  } catch (e) {
    console.error('[GET /api/cohorts]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  const { name, description, cohortKey, dealerCodes = [] } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const key = cohortKey?.trim() || name.trim()

  const existing = await query('SELECT id FROM cohorts WHERE name = ? OR cohort_key = ?', [name, key])
  if (existing.length) return NextResponse.json({ error: 'Name or cohort key already exists' }, { status: 400 })

  const segmentId = await createSegment(name, description)

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const syncedAt = dealerCodes.length ? now : null

  if (dealerCodes.length) {
    await addDealers(segmentId, dealerCodes)
    await assignCohort(dealerCodes, key)
  }

  const result = await query(
    `INSERT INTO cohorts (name, description, segment_id, cohort_key, status, last_synced_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?) RETURNING id`,
    [name, description || null, segmentId, key, syncedAt, now, now]
  )

  const cohort = await query('SELECT * FROM cohorts WHERE id = ?', [result[0].id])
  return NextResponse.json({ ...cohort[0], dealerCount: dealerCodes.length }, { status: 201 })
}

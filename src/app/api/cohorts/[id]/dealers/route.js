import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { assignCohort, clearCohort } from '@/lib/clevertap'

export async function PUT(req, { params }) {
  const { dealerCodes, remove } = await req.json()
  if (!dealerCodes?.length) return NextResponse.json({ error: 'dealerCodes required' }, { status: 400 })

  const [cohort] = await query('SELECT * FROM cohorts WHERE id = ?', [params.id])
  if (!cohort) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = new Date().toISOString()

  if (!remove) {
    // Overlap check — dealer must not be in another cohort
    const placeholders = dealerCodes.map(() => '?').join(',')
    const conflicts = await query(
      `SELECT dealer_code FROM cohort_dealers WHERE dealer_code IN (${placeholders}) AND cohort_id != ?`,
      [...dealerCodes, params.id]
    )
    if (conflicts.length) {
      const codes = conflicts.map(r => r.dealer_code).join(', ')
      return NextResponse.json({ error: `Dealers already in another cohort: ${codes}` }, { status: 400 })
    }

    for (const code of dealerCodes) {
      await query(
        'INSERT INTO cohort_dealers (cohort_id, dealer_code) VALUES (?, ?) ON CONFLICT DO NOTHING',
        [params.id, code]
      )
    }
    await assignCohort(dealerCodes, cohort.cohort_key)
  } else {
    const placeholders = dealerCodes.map(() => '?').join(',')
    await query(
      `DELETE FROM cohort_dealers WHERE cohort_id = ? AND dealer_code IN (${placeholders})`,
      [params.id, ...dealerCodes]
    )
    await clearCohort(dealerCodes)
  }

  await query('UPDATE cohorts SET last_synced_at = ?, updated_at = ? WHERE id = ?', [now, now, params.id])

  const [updated] = await query('SELECT * FROM cohorts WHERE id = ?', [params.id])
  const [{ count }] = await query('SELECT COUNT(*) as count FROM cohort_dealers WHERE cohort_id = ?', [params.id])
  return NextResponse.json({ ...updated, dealerCount: Number(count) })
}

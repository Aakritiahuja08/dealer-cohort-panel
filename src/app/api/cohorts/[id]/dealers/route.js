import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { addDealers, removeDealers, getDealerCount, getSegmentsForDealer } from '@/lib/segmentation'
import { assignCohort, clearCohort } from '@/lib/clevertap'

export async function PUT(req, { params }) {
  const { dealerCodes, remove } = await req.json()
  if (!dealerCodes?.length) return NextResponse.json({ error: 'dealerCodes required' }, { status: 400 })

  const [cohort] = await query('SELECT * FROM cohorts WHERE id = ?', [params.id])
  if (!cohort) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!remove) {
    // Overlap check — dealer must not already be in another cohort
    const conflicts = []
    for (const code of dealerCodes) {
      const segmentIds = await getSegmentsForDealer(code)
      for (const sid of segmentIds) {
        if (sid !== cohort.segment_id) {
          const [other] = await query('SELECT name FROM cohorts WHERE segment_id = ?', [sid])
          if (other) { conflicts.push(code); break }
        }
      }
    }
    if (conflicts.length) {
      return NextResponse.json({ error: `Dealers already in another cohort: ${conflicts.join(', ')}` }, { status: 400 })
    }

    await addDealers(cohort.segment_id, dealerCodes)
    await assignCohort(dealerCodes, cohort.cohort_key)
  } else {
    await removeDealers(cohort.segment_id, dealerCodes)
    await clearCohort(dealerCodes)
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await query('UPDATE cohorts SET last_synced_at = ?, updated_at = ? WHERE id = ?', [now, now, params.id])

  const [updated] = await query('SELECT * FROM cohorts WHERE id = ?', [params.id])
  const dealerCount = await getDealerCount(cohort.segment_id)
  return NextResponse.json({ ...updated, dealerCount })
}

import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PATCH(req, { params }) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const now = new Date().toISOString()
  await query('UPDATE cohorts SET status = ?, updated_at = ? WHERE id = ?', [status, now, params.id])

  const [cohort] = await query('SELECT * FROM cohorts WHERE id = ?', [params.id])
  if (!cohort) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ count }] = await query('SELECT COUNT(*) as count FROM cohort_dealers WHERE cohort_id = ?', [params.id])
  return NextResponse.json({ ...cohort, dealerCount: Number(count) })
}

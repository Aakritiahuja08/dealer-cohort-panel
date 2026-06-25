import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req, { params }) {
  const [cohort] = await query('SELECT * FROM cohorts WHERE id = ?', [params.id])
  if (!cohort) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [{ count }] = await query('SELECT COUNT(*) as count FROM cohort_dealers WHERE cohort_id = ?', [params.id])
  return NextResponse.json({ ...cohort, dealerCount: Number(count) })
}

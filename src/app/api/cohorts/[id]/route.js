import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getDealerCount } from '@/lib/segmentation'

export async function GET(req, { params }) {
  const [cohort] = await query('SELECT * FROM cohorts WHERE id = ?', [params.id])
  if (!cohort) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const dealerCount = await getDealerCount(cohort.segment_id)
  return NextResponse.json({ ...cohort, dealerCount })
}

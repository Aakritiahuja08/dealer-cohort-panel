import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getDealers } from '@/lib/segmentation'

export async function GET(req, { params }) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '0')
  const size = parseInt(searchParams.get('size') || '50')

  const [cohort] = await query('SELECT segment_id FROM cohorts WHERE id = ?', [params.id])
  if (!cohort) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const result = await getDealers(cohort.segment_id, page, size)
  return NextResponse.json({ ...result, page })
}

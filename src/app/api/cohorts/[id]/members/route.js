import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req, { params }) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '0')
  const size = parseInt(searchParams.get('size') || '50')
  const offset = page * size

  const [cohort] = await query('SELECT id FROM cohorts WHERE id = ?', [params.id])
  if (!cohort) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const dealers = await query(
    'SELECT dealer_code FROM cohort_dealers WHERE cohort_id = ? ORDER BY dealer_code LIMIT ? OFFSET ?',
    [params.id, size, offset]
  )
  const [{ count }] = await query('SELECT COUNT(*) as count FROM cohort_dealers WHERE cohort_id = ?', [params.id])

  return NextResponse.json({
    dealers: dealers.map(r => r.dealer_code),
    totalElements: Number(count),
    page
  })
}

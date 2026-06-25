import { NextResponse } from 'next/server'
import { runDealerReco } from '@/lib/dealer-reco'

export async function POST() {
  await runDealerReco()
  return NextResponse.json({ message: 'Dealer reco triggered successfully' })
}

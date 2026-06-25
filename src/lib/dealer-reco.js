export async function runDealerReco() {
  const res = await fetch(process.env.DEALER_RECO_URL, {
    method: 'POST',
    headers: {
      'Token': process.env.DEALER_RECO_TOKEN,
      'utm_source': process.env.DEALER_RECO_UTM_SOURCE
    }
  })
  if (!res.ok) throw new Error(`Dealer reco API error: ${res.status}`)
}

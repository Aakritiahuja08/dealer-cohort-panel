const API = process.env.SEGMENTATION_API_URL
const PIPELINE = process.env.SEGMENTATION_PIPELINE_URL

export async function createSegment(name, description) {
  const res = await fetch(`${PIPELINE}/v1/segments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description: description || '', type: 'STATIC' })
  })
  const data = await res.json()
  if (!data?.segmentId) throw new Error('Failed to create segment')
  return Number(data.segmentId)
}

export async function addDealers(segmentId, dealerCodes) {
  await fetch(`${PIPELINE}/v1/segments?isRemove=false`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ segmentId: String(segmentId), type: 'STATIC', entityIds: dealerCodes })
  })
}

export async function removeDealers(segmentId, dealerCodes) {
  await fetch(`${PIPELINE}/v1/segments?isRemove=true`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ segmentId: String(segmentId), type: 'STATIC', entityIds: dealerCodes })
  })
}

export async function getDealers(segmentId, page = 0, size = 50) {
  const res = await fetch(`${API}/api/segments?segmentId=${segmentId}&page=${page}&size=${size}`)
  const data = await res.json()
  return { dealers: data?.data || [], totalElements: data?.totalElements || 0 }
}

export async function getDealerCount(segmentId) {
  try {
    const res = await fetch(`${API}/api/segments?segmentId=${segmentId}&page=0&size=1`)
    const data = await res.json()
    return data?.totalElements || 0
  } catch {
    return 0
  }
}

export async function getSegmentsForDealer(dealerCode) {
  try {
    const res = await fetch(`${API}/api/segments/entity/${dealerCode}`)
    return await res.json()
  } catch {
    return []
  }
}

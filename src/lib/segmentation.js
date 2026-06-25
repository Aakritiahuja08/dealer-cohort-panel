// Read-only — used to browse dealers from an existing segment when creating a cohort
const API = process.env.SEGMENTATION_API_URL

export async function getDealersFromSegment(segmentId, page = 0, size = 50) {
  const res = await fetch(`${API}/api/segments?segmentId=${segmentId}&page=${page}&size=${size}`)
  const data = await res.json()
  return { dealers: data?.data || [], totalElements: data?.totalElements || 0 }
}

const API = process.env.CLEVERTAP_API_URL || 'https://eu1.api.clevertap.com'
const ACCOUNT_ID = process.env.CLEVERTAP_ACCOUNT_ID
const PASSCODE = process.env.CLEVERTAP_PASSCODE
const BATCH_SIZE = 1000

const headers = {
  'X-CleverTap-Account-Id': ACCOUNT_ID,
  'X-CleverTap-Passcode': PASSCODE,
  'Content-Type': 'application/json'
}

function chunk(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

async function uploadProfiles(dealerCodes, profileData) {
  for (const batch of chunk(dealerCodes, BATCH_SIZE)) {
    const payload = {
      d: batch.map(identity => ({ identity, type: 'profile', profileData }))
    }
    const res = await fetch(`${API}/1/upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(`CleverTap API error: ${res.status}`)
  }
}

export function assignCohort(dealerCodes, cohortKey) {
  return uploadProfiles(dealerCodes, { dealer_cohort: cohortKey })
}

export function clearCohort(dealerCodes) {
  return uploadProfiles(dealerCodes, { dealer_cohort: '' })
}

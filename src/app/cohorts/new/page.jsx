'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Upload, X, Info } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function CreateCohort() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', description: '', cohortKey: '' })
  const [dealers, setDealers] = useState([])
  const [input, setInput] = useState('')
  const keyPreview = form.cohortKey || form.name.toLowerCase().replace(/\s+/g, '_')

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create cohort')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success('Cohort created and synced to CleverTap')
      router.push(`/cohorts/${data.id}`)
    },
    onError: (e) => toast.error(e.message)
  })

  function addCode(raw) {
    const codes = raw.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
    setDealers(prev => [...new Set([...prev, ...codes])])
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input.trim()) addCode(input)
    }
  }

  function handleCSV(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => addCode(ev.target.result)
    reader.readAsText(file)
  }

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    mutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      cohortKey: form.cohortKey.trim() || undefined,
      dealerCodes: dealers
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cohorts" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">New Cohort</h1>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-700 space-y-1">
          <p className="font-medium">How it works</p>
          <p>1. A static segment is created in the segmentation service.</p>
          <p>2. Dealer codes are added to that segment.</p>
          <p>3. Each dealer's CleverTap profile gets <code className="bg-blue-100 px-1 rounded">dealer_cohort = "{keyPreview}"</code></p>
          <p className="mt-1">In your CleverTap campaign, filter by <code className="bg-blue-100 px-1 rounded">dealer_cohort == "{keyPreview}"</code></p>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
          <input
            className="input"
            placeholder="e.g. Premium Delhi Dealers"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Description</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Optional description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Cohort Key</label>
          <input
            className="input"
            placeholder={`Defaults to: ${keyPreview}`}
            value={form.cohortKey}
            onChange={e => setForm(f => ({ ...f, cohortKey: e.target.value }))}
          />
          <p className="text-xs text-gray-400">Unique identifier set as <code>dealer_cohort</code> on CleverTap profiles</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">Dealer Codes ({dealers.length})</label>
            <label className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 cursor-pointer">
              <Upload size={12} /> Upload CSV
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCSV} />
            </label>
          </div>
          <input
            className="input"
            placeholder="Type a code and press Enter, or paste comma-separated"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => input.trim() && addCode(input)}
          />
          {dealers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 max-h-32 overflow-y-auto">
              {dealers.map(code => (
                <span key={code} className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded px-2 py-0.5">
                  {code}
                  <button type="button" onClick={() => setDealers(d => d.filter(x => x !== code))}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link href="/cohorts" className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating…' : 'Create Cohort'}
          </button>
        </div>
      </form>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Users, Tag, CheckCircle2, Clock, Trash2,
  Upload, X, ChevronLeft, ChevronRight, AlertTriangle, ToggleLeft, ToggleRight
} from 'lucide-react'
import toast from 'react-hot-toast'

const fetcher = (url) => fetch(url).then(r => r.json())

export default function CohortDetail() {
  const { id } = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const [addInput, setAddInput] = useState('')
  const [addCodes, setAddCodes] = useState([])
  const [page, setPage] = useState(0)

  const { data: cohort, isLoading } = useQuery({
    queryKey: ['cohort', id],
    queryFn: () => fetcher(`/api/cohorts/${id}`)
  })

  const { data: members } = useQuery({
    queryKey: ['members', id, page],
    queryFn: () => fetcher(`/api/cohorts/${id}/members?page=${page}&size=50`),
    enabled: !!cohort
  })

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['cohort', id] })
    qc.invalidateQueries({ queryKey: ['members', id] })
    qc.invalidateQueries({ queryKey: ['cohorts'] })
  }

  const addMutation = useMutation({
    mutationFn: async (codes) => {
      const res = await fetch(`/api/cohorts/${id}/dealers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealerCodes: codes, remove: false })
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      return res.json()
    },
    onSuccess: () => { toast.success('Dealers added and synced to CleverTap'); setAddCodes([]); invalidate() },
    onError: e => toast.error(e.message)
  })

  const removeMutation = useMutation({
    mutationFn: async (code) => {
      const res = await fetch(`/api/cohorts/${id}/dealers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealerCodes: [code], remove: true })
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      return res.json()
    },
    onSuccess: () => { toast.success('Dealer removed'); invalidate() },
    onError: e => toast.error(e.message)
  })

  const statusMutation = useMutation({
    mutationFn: async (status) => {
      const res = await fetch(`/api/cohorts/${id}/status?status=${status}`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => { toast.success('Status updated'); invalidate() }
  })

  function addCode(raw) {
    const codes = raw.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
    setAddCodes(prev => [...new Set([...prev, ...codes])])
    setAddInput('')
  }

  function handleCSV(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => addCode(ev.target.result)
    reader.readAsText(file)
  }

  if (isLoading) return <Skeleton />
  if (!cohort || cohort.error) return <div className="text-sm text-gray-500 py-20 text-center">Cohort not found</div>

  const totalPages = members ? Math.ceil(members.totalElements / 50) : 0
  const isSynced = !!cohort.last_synced_at

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cohorts" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{cohort.name}</h1>
            {cohort.description && <p className="text-sm text-gray-500 mt-0.5">{cohort.description}</p>}
          </div>
        </div>
        <button
          onClick={() => statusMutation.mutate(cohort.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            cohort.status === 'ACTIVE'
              ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600'
              : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-700'
          }`}
        >
          {cohort.status === 'ACTIVE' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {cohort.status}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Stat icon={<Users size={15} className="text-gray-400" />} label="Dealers" value={cohort.dealerCount} />
        <Stat icon={<Tag size={15} className="text-orange-400" />} label="Cohort Key" value={<code className="text-orange-600">{cohort.cohort_key}</code>} />
        <Stat
          icon={isSynced ? <CheckCircle2 size={15} className="text-green-500" /> : <Clock size={15} className="text-yellow-500" />}
          label="CleverTap Sync"
          value={isSynced ? new Date(cohort.last_synced_at).toLocaleDateString() : 'Not synced'}
        />
      </div>

      {/* CleverTap filter hint */}
      <div className={`rounded-xl border p-4 ${isSynced ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-start gap-2">
          {isSynced ? <CheckCircle2 size={14} className="text-green-600 mt-0.5" /> : <AlertTriangle size={14} className="text-yellow-600 mt-0.5" />}
          <div>
            <p className={`text-xs font-medium ${isSynced ? 'text-green-800' : 'text-yellow-800'}`}>
              {isSynced ? 'Synced with CleverTap' : 'Not yet synced'}
            </p>
            <p className={`text-xs mt-0.5 ${isSynced ? 'text-green-700' : 'text-yellow-700'}`}>
              Campaign filter: <code className="bg-white/60 px-1 rounded">dealer_cohort == "{cohort.cohort_key}"</code>
            </p>
          </div>
        </div>
      </div>

      {/* Add dealers */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Add Dealers</h2>
          <label className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 cursor-pointer">
            <Upload size={12} /> CSV
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCSV} />
          </label>
        </div>
        <input
          className="input"
          placeholder="Type a dealer code and press Enter"
          value={addInput}
          onChange={e => setAddInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (addInput.trim()) addCode(addInput) }
          }}
          onBlur={() => addInput.trim() && addCode(addInput)}
        />
        {addCodes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {addCodes.map(c => (
              <span key={c} className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-100 rounded px-2 py-0.5">
                {c} <button type="button" onClick={() => setAddCodes(d => d.filter(x => x !== c))}><X size={10} /></button>
              </span>
            ))}
            <button
              onClick={() => addMutation.mutate(addCodes)}
              disabled={addMutation.isPending}
              className="ml-auto px-3 py-1 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50"
            >
              {addMutation.isPending ? 'Adding…' : `Add ${addCodes.length} dealer${addCodes.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>

      {/* Dealer list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">
            Members <span className="text-gray-400 font-normal">({members?.totalElements ?? '…'})</span>
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-40"><ChevronLeft size={14} /></button>
              <span className="text-xs text-gray-500">{page+1}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page >= totalPages-1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          )}
        </div>
        {!members?.dealers?.length ? (
          <div className="text-center py-12 text-sm text-gray-400">No dealers yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50"><th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Dealer Code</th><th /></tr></thead>
            <tbody>
              {members.dealers.map(code => (
                <tr key={code} className="border-b border-gray-50 group hover:bg-gray-50">
                  <td className="px-5 py-2.5 font-mono text-xs text-gray-700">{code}</td>
                  <td className="px-5 py-2.5 text-right">
                    <button
                      onClick={() => removeMutation.mutate(code)}
                      disabled={removeMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-600 rounded text-gray-400 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-64" />
      <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
      <div className="h-48 bg-gray-100 rounded-xl" />
    </div>
  )
}

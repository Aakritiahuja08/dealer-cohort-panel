'use client'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Users, ChevronRight, CheckCircle2, Clock, Tag, Play } from 'lucide-react'
import toast from 'react-hot-toast'

const fetcher = (url) => fetch(url).then(r => r.json())

export default function CohortList() {
  const { data: cohorts = [], isLoading, refetch } = useQuery({
    queryKey: ['cohorts'],
    queryFn: () => fetcher('/api/cohorts')
  })

  const recoMutation = useMutation({
    mutationFn: () => fetch('/api/cohorts/run-reco', { method: 'POST' }).then(r => r.json()),
    onSuccess: () => toast.success('Dealer reco triggered — campaigns are running'),
    onError: () => toast.error('Failed to trigger dealer reco')
  })

  if (isLoading) return <Skeleton />

  const active = cohorts.filter(c => c.status === 'ACTIVE')
  const inactive = cohorts.filter(c => c.status === 'INACTIVE')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dealer Cohorts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cohorts.length} cohort{cohorts.length !== 1 ? 's' : ''} · {active.length} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => recoMutation.mutate()}
            disabled={recoMutation.isPending || cohorts.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Play size={14} />
            {recoMutation.isPending ? 'Running…' : 'Run Dealer Reco'}
          </button>
          <Link
            href="/cohorts/new"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg"
          >
            <Plus size={14} /> New Cohort
          </Link>
        </div>
      </div>

      {cohorts.length === 0 ? <EmptyState /> : (
        <div className="space-y-8">
          {active.length > 0 && (
            <Section title="Active" count={active.length}>
              {active.map(c => <CohortCard key={c.id} cohort={c} />)}
            </Section>
          )}
          {inactive.length > 0 && (
            <Section title="Inactive" count={inactive.length}>
              {inactive.map(c => <CohortCard key={c.id} cohort={c} />)}
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, count, children }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title} · {count}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  )
}

function CohortCard({ cohort }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900 text-sm">{cohort.name}</h3>
          {cohort.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{cohort.description}</p>}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cohort.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {cohort.status}
        </span>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1 text-xs text-gray-500"><Users size={13} />{cohort.dealerCount} dealers</div>
        <div className="flex items-center gap-1 text-xs text-gray-500"><Tag size={13} /><code className="text-orange-600">{cohort.cohort_key}</code></div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <SyncStatus syncedAt={cohort.last_synced_at} />
        <Link href={`/cohorts/${cohort.id}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900">
          Manage <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  )
}

function SyncStatus({ syncedAt }) {
  if (!syncedAt) return <div className="flex items-center gap-1 text-xs text-gray-400"><Clock size={11} />Never synced</div>
  return <div className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 size={11} />Synced {new Date(syncedAt).toLocaleDateString()}</div>
}

function EmptyState() {
  return (
    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
      <Users size={32} className="mx-auto text-gray-300 mb-3" />
      <p className="text-sm font-medium text-gray-500">No cohorts yet</p>
      <p className="text-xs text-gray-400 mt-1 mb-4">Create a dealer cohort to get started</p>
      <Link href="/cohorts/new" className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg">
        <Plus size={14} /> New Cohort
      </Link>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-100 rounded-lg w-48 animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    </div>
  )
}

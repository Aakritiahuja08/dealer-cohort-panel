'use client'
import Link from 'next/link'
import { Zap, LayoutGrid } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-orange-500 rounded-md flex items-center justify-center">
            <Zap size={15} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">Dealer Cohort Panel</span>
        </div>
        <nav>
          <Link
            href="/cohorts"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${pathname.startsWith('/cohorts')
                ? 'bg-orange-50 text-orange-600'
                : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <LayoutGrid size={15} /> Cohorts
          </Link>
        </nav>
      </div>
    </header>
  )
}

import './globals.css'
import Providers from '@/components/Providers'
import Header from '@/components/Header'

export const metadata = { title: 'Dealer Cohort Panel' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}

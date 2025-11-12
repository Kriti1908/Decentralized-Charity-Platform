import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CharityChain - Transparent Blockchain Charity Platform',
  description: 'Transparent charity platform powered by blockchain technology. Donate with confidence, track impact in real-time.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <footer className="bg-gray-900 text-white py-8 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p>&copy; 2025 CharityChain. All rights reserved.</p>
              <p className="text-gray-400 text-sm mt-2">Built on Ethereum for transparency and trust</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}

import './globals.css'
import type { ReactNode } from 'react'
import ClientProviders from './providers/ClientProviders'
import AuthGate from './providers/AuthGate'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen min-w-full transition-colors bg-blue-500">
        <ClientProviders>
          <AuthGate>
            {children}
          </AuthGate>
        </ClientProviders>
      </body>
    </html>
  )
}
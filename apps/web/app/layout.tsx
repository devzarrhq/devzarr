import './globals.css'
import type { ReactNode } from 'react'
import ClientProviders from './providers/ClientProviders'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen min-w-full transition-colors bg-blue-500">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
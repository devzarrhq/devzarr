import './globals.css'
import type { ReactNode } from 'react'
import { ThemeProvider } from './theme-context'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100 min-h-screen min-w-full transition-colors">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
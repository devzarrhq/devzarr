import './globals.css'
import type { ReactNode } from 'react'
import { ThemeProvider } from './theme-context'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen min-w-full transition-colors">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
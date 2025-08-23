import './globals.css'
import type { ReactNode } from 'react'
import ClientProviders from './providers/ClientProviders'
import { useAuth } from './providers/AuthProvider'
import { useRouter, usePathname } from 'next/navigation'

function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Allow access to /login always
  if (pathname === "/login") return <>{children}</>;

  if (loading) return null; // or a spinner

  if (!session) {
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }

  return <>{children}</>;
}

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
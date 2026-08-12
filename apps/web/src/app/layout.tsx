import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Job Applications',
  description: 'Track the jobs you have applied to.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="mx-auto max-w-5xl px-4 py-10">{children}</div>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SeeSea Intelligence',
  description: 'Maritime Intelligence Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}

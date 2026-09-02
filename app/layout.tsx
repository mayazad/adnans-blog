import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: "Adnan's Blog — Field notes on artificial intelligence",
    template: "%s | Adnan's Blog",
  },
  description:
    "Adnan's Blog is about AI — how it works, where it fails, and what comes next. Written by Adnan.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: "Adnan's Blog",
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

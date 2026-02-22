import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono, Barlow_Condensed } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { SWRegister } from '@/components/sw-register'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

const heading = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-heading',
})

export const metadata: Metadata = {
  title: 'Crank',
  description: 'AI-driven music curation for CrossFit workouts',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Crank',
  },
}

export const viewport: Viewport = {
  themeColor: '#0C0C10',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${jakarta.variable} ${mono.variable} ${heading.variable} font-sans`}>
        {children}
        <Toaster position="top-center" />
        <SWRegister />
      </body>
    </html>
  )
}

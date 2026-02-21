import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
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
  themeColor: '#FAFAFA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${jakarta.variable} ${mono.variable} font-sans`}>
        {children}
        <Toaster position="top-center" />
        <SWRegister />
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { NavBar } from '@/components/nav-bar'
import { SWRegister } from '@/components/sw-register'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CrossFit Playlist Generator',
  description: 'Generate custom workout playlists from CrossFit workout descriptions',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CF Playlist',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
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
      <body className={inter.className}>
        <NavBar />
        {children}
        <Toaster position="top-center" />
        <SWRegister />
      </body>
    </html>
  )
}

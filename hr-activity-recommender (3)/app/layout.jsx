import React from "react"

import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { DataProvider } from '@/lib/data-store'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata = {
  title,
  description,
  generator,
  icons: {
    icon: [
      {
        url,
        media,
      },
      {
        url,
        media,
      },
      {
        url,
        type,
      },
    ],
    apple,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <DataProvider>
            {children}
            <Toaster richColors position="top-right" />
          </DataProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}



